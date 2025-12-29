import pool from "../db.js";
import fs from "fs";
import { parseStringPromise, Builder } from "xml2js";
import multer from "multer";
import path from "path";

// Multer konfigurācija – augšupielādētie faili tiek saglabāti uploads/ mapē
// Multer automātiski pievieno informāciju par failu objektā req.file
const upload = multer({ dest: "uploads/" });

/**
 * Nosaka, vai dokuments ir pilnībā kontēts.
 * - Saskaita tikai tās dokumenta rindas, kuras ir atzīmētas kā kontējamas (supplementary_notice = "1")
 * - Salīdzina rindu summu ar dokumenta kopējo summu
 */
const calculateIsAccounted = (lines, docAmount) => {
  // Saskaita tikai rindas ar supplementary_notice = "1"
  // Summē centos, lai izvairītos no peldošā punkta kļūdām
  const totalCents = lines
    .filter((l) => l.line_supplementary_notice === "1")
    .reduce((sum, l) => sum + Math.round(Number(l.line_amount || 0) * 100), 0);

  // Dokumenta kopējo summu pārvērš centos
  const docAmountCents = Math.round(Number(docAmount) * 100);

  // Ja summas sakrīt → dokuments ir pilnībā iegrāmatots
  return totalCents === docAmountCents;
};

/**
 * Iegūst visus dokumentus konkrētam uzņēmumam
 */
export const getDocuments = async (req, res) => {
  try {
    const companyID = req.params.companyId;

    // Atlasa visus dokumentus, sakārtojot pēc datuma (jaunākie augšā)
    const docsResult = await pool.query("SELECT * FROM documents WHERE company_id = $1 ORDER BY doc_date DESC", [companyID]);

    res.status(200).json(docsResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

/**
 * Izveido jaunu dokumentu
 * - Saglabā dokumenta pamata datus
 * - Ja ir PDF fails, saglabā tā ceļu
 * - Pēc izveides pārbauda, vai dokuments jau ir pilnībā nokontēts
 */
export const createDocument = async (req, res) => {
  try {
    const companyID = req.params.companyId;

    const { partner_id, doc_id, doc_date, doc_type_abbrev, doc_group_abbrev, doc_currency, doc_amount, doc_comments, is_accounted } =
      req.body;

    // PDF faila ceļš (ja fails nav pievienots, paliek null)
    let pdf_path = null;

    if (req.file) {
      // Saglabā PDF failu
      const ext = path.extname(req.file.originalname);
      const newFilename = req.file.filename + ext;

      const fs = await import("fs");
      const oldPath = req.file.path;
      const newPath = path.join(path.dirname(oldPath), newFilename);

      // Pārsauc Multer pagaidu failu, pievienojot .pdf
      await fs.promises.rename(oldPath, newPath);

      pdf_path = newPath;
    }

    // Ievieto dokumentu datubāzē
    const result = await pool.query(
      `INSERT INTO documents
        (company_id, partner_id, doc_id, doc_date, doc_type_abbrev, doc_group_abbrev,
         doc_currency, doc_amount, doc_comments, is_accounted, pdf_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        companyID,
        partner_id ? partner_id : null,
        doc_id,
        doc_date,
        doc_type_abbrev,
        doc_group_abbrev,
        doc_currency,
        doc_amount,
        doc_comments,
        is_accounted || false,
        pdf_path,
      ]
    );

    const newDocument = result.rows[0];

    res.status(201).json(newDocument);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Pievienošana" });
  }
};

/**
 * Palīgfunkcija partnera vārda nolasīšanai no XML
 * - Juridiskai personai: "Nosaukums, SIA"
 * - Fiziskai personai: "Uzvārds Vārds"
 */
function parseXMLPartnerName(xmlName, xmlKindName) {
  if (!xmlName) return { name: "", title: "" };

  xmlName = xmlName.trim();

  // Juridiska persona: nosaukums un title atdalīti ar komatu
  if (xmlKindName === "Juridiska persona") {
    if (xmlName.includes(",")) {
      const [name, title] = xmlName.split(",").map((s) => s.trim());
      return { name, title };
    }
    return { name: xmlName, title: "" };
  }

  // Fiziska persona: title tiek uzskatīts par uzvārdu
  const parts = xmlName.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    const title = parts[0];
    const name = parts.slice(1).join(" ");
    return { name, title };
  }

  return { name: xmlName, title: "" };
}

/**
 * Izveido jaunus dokumentus
 * - Saglabā dokumentu pamata datus no XML faila, kas iegūts no Jumis
 * - Ja dokuments jau eksistē, tas netiek vēlreiz importēts
 * - Atgriež jaunizveidotos dokumentus un skaitu, cik dokumentu tika izlaisti
 */
export const importXmlDocuments = [
  // Upload middleware. "xmlFile" ir lauka nosaukums iekš form-data. Pievieno req.file
  upload.single("xmlFile"),

  async (req, res) => {
    try {
      const companyID = req.params.companyId;

      // Nolasa XML failu
      const xmlData = fs.readFileSync(req.file.path, "utf-8");

      // Pārveido XML uz JavaScript objektu
      const result = await parseStringPromise(xmlData, { explicitArray: false });

      // Izvelk FinancialDoc blokus no XML
      const financialDocsRaw = result.dataroot.tjResponse.FinancialDoc;
      // Nodrošina, ka vienmēr strādā ar masīvu
      const financialDocs = Array.isArray(financialDocsRaw) ? financialDocsRaw : [financialDocsRaw];

      // Ielādē visus uzņēmuma partnerus no DB, vajadzīgi partnera piesaistes mēģinājumiem
      const { rows: partnerRows } = await pool.query(
        "SELECT id, partner_reg_nr, partner_name, partner_title, partner_kind_name FROM partners WHERE company_id=$1",
        [companyID]
      );

      // Palīgstruktūras partneru ātrai atrašanai
      const partnersByRegNr = {};
      const partnersByName = {};

      // Sagatavo lookup tabulas
      partnerRows.forEach((p) => {
        // Meklēšana pēc reģistrācijas numura
        if (p.partner_reg_nr) partnersByRegNr[p.partner_reg_nr.trim()] = p.id;

        // Meklēšana pēc formatēta nosaukuma
        let key;
        if (p.partner_kind_name === "Juridiska persona") {
          key = `${p.partner_name}${p.partner_title ? ", " + p.partner_title : ""}`.trim().toLowerCase();
        } else {
          key = `${p.partner_title} ${p.partner_name}`.trim().toLowerCase();
        }
        partnersByName[key] = p.id;
      });

      const newDocuments = [];
      let skippedCount = 0;

      // Apstrādā katru XML dokumentu
      for (const doc of financialDocs) {
        let partner_id = null;

        // 1. Mēģina piesaistīt partneri pēc reģistrācijas numura
        const regNr = doc.DocPartnerRegistrationNo?.trim();
        if (regNr && partnersByRegNr[regNr]) {
          partner_id = partnersByRegNr[regNr];
        } else {
          // 2. Ja neizdevās – mēģina piesaistīt pēc nosaukuma
          const xmlName = doc.DocPartnerName || "";
          const xmlKind = doc.DocPartnerKindName;

          // Normalizē XML partnera vārdu
          const { name, title } = parseXMLPartnerName(xmlName, xmlKind);

          let key;
          if (xmlKind === "Juridiska persona") {
            key = `${name}${title ? ", " + title : ""}`.trim().toLowerCase();
          } else {
            key = `${title} ${name}`.trim().toLowerCase();
          }

          if (partnersByName[key]) partner_id = partnersByName[key];
        }

        let insertedDoc;

        try {
          // Ievieto dokumentu DB
          const docQuery = `
            INSERT INTO documents
            (company_id, partner_id, doc_id, doc_date, doc_type_abbrev,
             doc_group_abbrev, doc_currency, doc_amount, doc_comments, is_accounted)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
            RETURNING *;
          `;

          const { rows: docRows } = await pool.query(docQuery, [
            companyID,
            partner_id,
            doc.DocNo,
            doc.DocDate,
            doc.DocTypeAbbreviation,
            doc.DocGroupAbbreviation,
            doc.DocCurrency,
            parseFloat(doc.DocAmount),
            doc.DocComments,
          ]);

          insertedDoc = docRows[0];
        } catch (err) {
          // Ja dokuments jau eksistē (unikāls ierobežojums) – izlaiž
          if (err.code === "23505") {
            skippedCount++;
            continue;
          }
          throw err;
        }

        let insertedLines = [];

        // Ja dokumentam ir kontējuma rindas – ievieto tās
        if (doc.FinancialDocLine) {
          const lines = Array.isArray(doc.FinancialDocLine) ? doc.FinancialDocLine : [doc.FinancialDocLine];

          for (const line of lines) {
            const lineQuery = `
              INSERT INTO document_lines
              (document_id, line_supplementary_notice, line_currency, line_amount,
               line_debet_account, line_credit_account, line_vat_rate, line_comments)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING *;
            `;

            const { rows: lineRows } = await pool.query(lineQuery, [
              insertedDoc.id,
              line.LineSupplementaryNoticeID,
              line.LineCurrency,
              parseFloat(line.LineAmount),
              line.LineDebetAccountCode || null,
              line.LineCreditAccountCode || null,
              line.LineVatRate || null,
              line.LineComments || null,
            ]);

            insertedLines.push(...lineRows);
          }
        }

        // Pārbauda, vai dokuments ir pilnībā nokontēts
        const isFullyAccounted = calculateIsAccounted(insertedLines, insertedDoc.doc_amount);

        // Atjaunina is_accounted lauku dokumentam
        const { rows: updatedDocRows } = await pool.query("UPDATE documents SET is_accounted=$1 WHERE id=$2 RETURNING *", [
          isFullyAccounted,
          insertedDoc.id,
        ]);

        newDocuments.push(updatedDocRows[0]);
      }

      // Dzēš pagaidu XML failu
      fs.unlinkSync(req.file.path);

      res.status(201).json({ newDocuments, skippedCount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Neparedzēta servera kļūda" });
    }
  },
];

/**
 * Iegūst vienu dokumentu pēc ID
 */
export const getDocument = async (req, res) => {
  try {
    const companyID = req.params.companyId;
    const { document_id } = req.params;

    // Atlasa konkrētu dokumentu uzņēmuma ietvaros
    const docResult = await pool.query("SELECT * FROM documents WHERE company_id = $1 AND id = $2", [companyID, document_id]);

    res.status(200).json(docResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dabūšana" });
  }
};

/**
 * Atjaunina dokumenta is_accounted statusu.
 * Saņem document_id un jauno is_accounted vērtību un atjaunina ierakstu DB.
 */
export const updateDocumentAccounted = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { is_accounted } = req.body;

    // UPDATE is_accounted lauku dokumentam ar konkrētu ID
    const result = await pool.query("UPDATE documents SET is_accounted=$1 WHERE id=$2 RETURNING *", [is_accounted, document_id]);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

/**
 * Rediģē dokumenta galveno informāciju.
 * - Atjaunina partner_id, doc_id, utt.
 * - Pārbauda, vai dokumenta kontējumu summas sakrīt ar doc_amount, lai iestatītu is_accounted
 */
export const editDocument = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { partner_id, doc_id, doc_date, doc_type_abbrev, doc_group_abbrev, doc_currency, doc_amount, doc_comments } = req.body;

    // Iegūst dokumenta rindas, lai aprēķinātu is_accounted
    const { rows: lines } = await pool.query("SELECT line_amount, line_supplementary_notice FROM document_lines WHERE document_id=$1", [
      document_id,
    ]);

    // Aprēķina summu centos tikai par tām rindām, kas ir supplementary_notice
    const totalCents = lines
      .filter((l) => l.line_supplementary_notice === "1")
      .reduce((sum, l) => sum + Math.round(Number(l.line_amount || 0) * 100), 0);

    const docAmountCents = Math.round(Number(doc_amount) * 100);
    const isAccounted = totalCents === docAmountCents;

    // Atjaunina dokumentu DB ar jaunajiem datiem un aprēķināto is_accounted
    const result = await pool.query(
      `UPDATE documents
       SET partner_id = $1,
           doc_id = $2,
           doc_date = $3,
           doc_type_abbrev = $4,
           doc_group_abbrev = $5,
           doc_currency = $6,
           doc_amount = $7,
           doc_comments = $8,
           is_accounted = $9
       WHERE id = $10
       RETURNING *`,
      [
        partner_id || null,
        doc_id,
        doc_date,
        doc_type_abbrev,
        doc_group_abbrev,
        doc_currency,
        doc_amount,
        doc_comments,
        isAccounted,
        document_id,
      ]
    );

    // Atgriež atjaunināto dokumentu
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

/**
 * Iegūst visas kontējumu rindas konkrētam dokumentam.
 * Rindas tiek sakārtotas pēc line_supplementary_notice (tās ar 1 vispirms).
 */
export const getLines = async (req, res) => {
  try {
    const documentID = req.params.document_id;

    // SELECT visas rindas dokumentam, sakārtotas pēc line_supplementary_notice DESC
    const linesResult = await pool.query("SELECT * FROM document_lines WHERE document_id = $1 ORDER BY line_supplementary_notice DESC", [
      documentID,
    ]);

    res.status(200).json(linesResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

/**
 * Rediģē, ievieto un dzēš dokumenta kontējumu rindas.
 * Saņem trīs masīvus: updated, inserted un deleted un atjauno DB.
 */
export const editLines = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { updated = [], inserted = [], deleted = [] } = req.body;

    // Apstrādā atjauninātas rindas
    for (const line of updated) {
      const vatRate = line.line_vat_rate === "" ? null : line.line_vat_rate;

      // UPDATE rindas ar jauniem datiem
      await pool.query(
        `
        UPDATE document_lines
        SET
          line_supplementary_notice = $1,
          line_currency = $2,
          line_amount = $3,
          line_debet_account = $4,
          line_credit_account = $5,
          line_vat_rate = $6,
          line_comments = $7
        WHERE id = $8
          AND document_id = $9
        RETURNING *
        `,
        [
          line.line_supplementary_notice,
          line.line_currency,
          line.line_amount,
          line.line_debet_account,
          line.line_credit_account,
          vatRate,
          line.line_comments,
          line.id,
          document_id,
        ]
      );
    }

    // Apstrādā jaunas rindas
    for (const line of inserted) {
      const vatRate = line.line_vat_rate === "" ? null : line.line_vat_rate;

      // INSERT jauna rinda dokumentam
      await pool.query(
        `
        INSERT INTO document_lines (
          document_id,
          line_supplementary_notice,
          line_currency,
          line_amount,
          line_debet_account,
          line_credit_account,
          line_vat_rate,
          line_comments
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
        `,
        [
          document_id,
          line.line_supplementary_notice,
          line.line_currency,
          line.line_amount,
          line.line_debet_account,
          line.line_credit_account,
          vatRate,
          line.line_comments,
        ]
      );
    }

    // Dzēš norādītās rindas
    if (deleted.length > 0) {
      await pool.query(`DELETE FROM document_lines WHERE id = ANY($1::int[]) AND document_id = $2`, [deleted, document_id]);
    }

    // Iegūst visas rindas pēc izmaiņām, lai atgrieztu klientam
    const { rows: allLines } = await pool.query(`SELECT * FROM document_lines WHERE document_id = $1 ORDER BY id`, [document_id]);

    res.status(200).json({ allLines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

/**
 * Dzēš dokumentu un visas tā rindas.
 * Ja dokumentam ir pievienots PDF fails, tas tiek izdzēsts no failu sistēmas.
 */
export const deleteDocument = async (req, res) => {
  const { document_id } = req.params;

  try {
    // Iegūst PDF ceļu, ja tāds ir
    const docResult = await pool.query("SELECT pdf_path FROM documents WHERE id = $1", [document_id]);
    const pdfPath = docResult.rows[0].pdf_path;

    // Ja bija PDF fails, dzēš no failu sistēmas
    if (pdfPath) {
      const fullPath = path.join(process.cwd(), pdfPath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error(err);
      });
    }

    // Dzēš dokumenta ierakstu
    const result = await pool.query("DELETE FROM documents WHERE id = $1", [document_id]);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

/**
 * Masveida dzēšana – dzēš vairākus dokumentus un to kontējumu rindas pēc ID masīva.
 * Ja dokumentiem ir pievienoti PDF faili, tie tiek dzēsti no failu sistēmas.
 */
export const bulkDeleteDocuments = async (req, res) => {
  const { ids } = req.body;

  try {
    // Iegūst PDF ceļus dokumentiem
    const docsResult = await pool.query("SELECT pdf_path FROM documents WHERE id = ANY($1)", [ids]);
    const pdfPaths = docsResult.rows.map((row) => row.pdf_path).filter(Boolean);

    // Dzēš PDF failus no failu sistēmas
    pdfPaths.forEach((pdfPath) => {
      const fullPath = path.join(process.cwd(), pdfPath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error(err);
      });
    });

    // Dzēš dokumentus
    const result = await pool.query("DELETE FROM documents WHERE id = ANY($1) RETURNING *", [ids]);

    res.status(200).json({ deletedCount: result.rowCount, deletedRows: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

/**
 * Eksportē dokumentus uz XML formātu, iekļaujot arī to kontējumu rindas.
 * Izveido TJ XML struktūru, atbilstošu finanšu dokumentu importam Jumī.
 */
export const exportDocuments = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const { ids } = req.body;

    // Iegūst dokumentus ar partneru informāciju
    const docQuery = `
      SELECT d.*, 
             p.partner_title,
             p.partner_name,
             p.partner_reg_nr,
             p.partner_kind_name,
             p.vat_nr,
             p.vat_country_code
      FROM documents d
      LEFT JOIN partners p ON d.partner_id = p.id
      WHERE d.company_id = $1 AND d.id = ANY($2)
      ORDER BY d.doc_id;
    `;
    const { rows: docs } = await pool.query(docQuery, [companyId, ids]);

    // Iegūst visus kontējumu ierakstus atlasītajiem dokumentiem
    const lineQuery = `
      SELECT *
      FROM document_lines
      WHERE document_id = ANY($1)
      ORDER BY id;
    `;
    const { rows: allLines } = await pool.query(lineQuery, [ids]);

    // Map, kur rindas sakārtotas pēc dokumenta ID
    const linesMap = {};
    allLines.forEach((line) => {
      if (!linesMap[line.document_id]) linesMap[line.document_id] = [];
      linesMap[line.document_id].push(line);
    });

    // Pārveido dokumentus un to rindas uz XML blokiem
    const financialDocsXml = docs.map((doc) => {
      let DocPartnerName = "";

      // Partnera vārda formatēšana atkarībā no kind_name
      if (doc.partner_kind_name === "Fiziska persona") {
        DocPartnerName = [doc.partner_title, doc.partner_name].filter(Boolean).join(" ");
      } else {
        DocPartnerName = [doc.partner_name, doc.partner_title].filter(Boolean).join(", ");
      }

      const DocPartnerRegistrationNo = doc.partner_reg_nr || "";

      // Transformē rindas uz XML blokiem
      const lineBlocks = (linesMap[doc.id] || []).map((line) => ({
        LineSupplementaryNoticeID: line.line_supplementary_notice || 1,
        LineCurrency: line.line_currency || "EUR",
        LineAmount: line.line_amount?.toString() || "0",
        LineDebetAccountCode: line.line_debet_account || "",
        LineCreditAccountCode: line.line_credit_account || "",
        ...(line.line_vat_rate ? { LineVatRate: line.line_vat_rate.toString() } : {}),
        ...(line.line_comments ? { LineComments: line.line_comments } : {}),
      }));

      return {
        FinancialDoc: {
          DocNo: doc.doc_id,
          DocDate: doc.doc_date,
          DocTypeAbbreviation: doc.doc_type_abbrev,
          DocGroupAbbreviation: doc.doc_group_abbrev || "-",
          DocCurrency: doc.doc_currency || "EUR",
          DocAmount: doc.doc_amount?.toString() || "0",
          DocAmountLockedNoticeID: "0",
          DocPartnerName,
          DocPartnerRegistrationNo,
          ...(doc.vat_nr ? { DocPartnerVatNo: doc.vat_nr } : {}),
          ...(doc.vat_country_code ? { DocPartnerVatNoCountryCode: doc.vat_country_code } : {}),
          DocDisbursementNoticeID: "0",
          ...(doc.doc_comments ? { DocComments: doc.doc_comments } : {}),
          FinancialDocLine: lineBlocks,
        },
      };
    });

    // Galīgais XML objekts ar TJ struktūru
    const xmlObj = {
      dataroot: {
        tjDocument: {
          $: { Version: "TJ5.5.101" },
        },
        tjResponse: {
          $: {
            Name: "FinancialDoc",
            Operation: "Insert",
            Version: "TJ7.0.112",
            Structure: "Tree",
          },
          ...financialDocsXml.reduce((acc, item) => {
            if (!acc.FinancialDoc) acc.FinancialDoc = [];
            acc.FinancialDoc.push(item.FinancialDoc);
            return acc;
          }, {}),
        },
      },
    };

    // Izveido XML no objekta
    const builder = new Builder({ headless: false, xmldec: { version: "1.0", encoding: "UTF-8" } });
    const xml = builder.buildObject(xmlObj);

    // Iestata headerus faila lejupielādei
    res.setHeader("Content-Disposition", "attachment; filename=financial_documents.xml");
    res.setHeader("Content-Type", "application/xml");

    return res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};
