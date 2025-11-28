import pool from "../db.js";
import fs from "fs";
import { parseStringPromise, Builder } from "xml2js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const calculateIsAccounted = (lines, docAmount) => {
  const totalCents = lines
    .filter((l) => l.line_supplementary_notice === "1")
    .reduce((sum, l) => sum + Math.round(Number(l.line_amount || 0) * 100), 0);
  const docAmountCents = Math.round(Number(docAmount) * 100);
  return totalCents === docAmountCents;
};

export const getDocuments = async (req, res) => {
  try {
    const companyID = req.params.companyId;
    const docsResult = await pool.query("SELECT * FROM documents WHERE company_id = $1 ORDER BY doc_date DESC", [companyID]);
    res.json(docsResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const importDocuments = [
  upload.single("xmlFile"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const companyID = req.params.companyId;
      const xmlData = fs.readFileSync(req.file.path, "utf-8");
      const result = await parseStringPromise(xmlData, { explicitArray: false });

      const financialDocsRaw = result.dataroot.tjResponse.FinancialDoc;
      const financialDocs = Array.isArray(financialDocsRaw) ? financialDocsRaw : [financialDocsRaw];

      const { rows: partnerRows } = await pool.query("SELECT id, partner_reg_nr FROM partners WHERE company_id=$1", [companyID]);

      const partnersMap = {};
      partnerRows.forEach((p) => {
        partnersMap[p.partner_reg_nr] = p.id;
      });

      const newDocuments = [];

      for (const doc of financialDocs) {
        const partner_id = partnersMap[doc.DocPartnerRegistrationNo] || null;

        const docQuery = `
          INSERT INTO documents
          (company_id, partner_id, doc_id, doc_date, doc_type_abbrev, doc_group_abbrev, doc_currency, doc_amount, doc_comments, is_accounted)
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

        const insertedDoc = docRows[0];
        newDocuments.push(insertedDoc);

        let insertedLines = [];

        if (doc.FinancialDocLine) {
          const lines = Array.isArray(doc.FinancialDocLine) ? doc.FinancialDocLine : [doc.FinancialDocLine];

          for (const line of lines) {
            const lineQuery = `
              INSERT INTO document_lines
              (document_id, line_supplementary_notice, line_currency, line_amount, line_debet_account, line_credit_account, line_vat_rate, line_comments)
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

          const isFullyAccounted = calculateIsAccounted(insertedLines, insertedDoc.doc_amount);
          await pool.query("UPDATE documents SET is_accounted=$1 WHERE id=$2", [isFullyAccounted, insertedDoc.id]);
        }
      }

      fs.unlinkSync(req.file.path);
      res.json({ message: "Import successful", newDocuments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to import XML" });
    }
  },
];

export const getDocument = async (req, res) => {
  try {
    const companyID = req.params.companyId;
    const { document_id } = req.params;
    const docResult = await pool.query("SELECT * FROM documents WHERE company_id = $1 AND id = $2", [companyID, document_id]);
    res.json(docResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateDocumentAccounted = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { is_accounted } = req.body;

    const result = await pool.query("UPDATE documents SET is_accounted=$1 WHERE id=$2 RETURNING *", [is_accounted, document_id]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Dokuments nav atrasts" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Kļūda atjauninot is_accounted:", err);
    res.status(500).json({ error: "Neizdevās atjaunināt is_accounted" });
  }
};

export const editDocument = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { partner_id, doc_id, doc_date, doc_type_abbrev, doc_group_abbrev, doc_currency, doc_amount, doc_comments, is_accounted } =
      req.body;

    if (!doc_id || !doc_date || !doc_type_abbrev || !doc_group_abbrev || !doc_currency || !doc_amount) {
      return res.status(400).json({ error: "Some fields are required" });
    }

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
        partner_id ? partner_id : null,
        doc_id,
        doc_date,
        doc_type_abbrev,
        doc_group_abbrev,
        doc_currency,
        doc_amount,
        doc_comments,
        is_accounted,
        document_id,
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Dokuments nav atrasts" });

    const { rows: lines } = await pool.query("SELECT * FROM document_lines WHERE document_id=$1", [document_id]);
    const isFullyPosted = calculateIsAccounted(lines, doc_amount);
    await pool.query("UPDATE documents SET is_accounted=$1 WHERE id=$2", [isFullyPosted, document_id]);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Kļūda rediģējot dokumentu:", err);
    res.status(500).json({ error: "Neizdevās rediģēt dokumentu" });
  }
};

export const getLines = async (req, res) => {
  try {
    const documentID = req.params.document_id;
    const linesResult = await pool.query("SELECT * FROM document_lines WHERE document_id = $1 ORDER BY line_supplementary_notice DESC", [
      documentID,
    ]);
    res.json(linesResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const editLines = async (req, res) => {
  try {
    const { document_id } = req.params;
    const lines = req.body;

    if (!Array.isArray(lines)) return res.status(400).json({ error: "Expected an array of lines." });

    for (const line of lines) {
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
        `,
        [
          line.line_supplementary_notice,
          line.line_currency,
          line.line_amount,
          line.line_debet_account,
          line.line_credit_account,
          line.line_vat_rate,
          line.line_comments,
          line.id,
          document_id,
        ]
      );
    }

    res.json({ message: "Kontējumi mainīti!" });
  } catch (err) {
    console.error("Kļūda rediģējot kontējumus:", err);
    res.status(500).json({ error: "Neizdevās rediģēt kontējumus" });
  }
};

export const deleteDocument = async (req, res) => {
  const { document_id } = req.params;
  try {
    await pool.query("DELETE FROM document_lines WHERE document_id = $1", [document_id]);
    const result = await pool.query("DELETE FROM documents WHERE id = $1 RETURNING *", [document_id]);

    if (result.rowCount === 0) return res.status(404).json({ message: "Finanšu dokuments nav atrasts" });

    res.status(200).json({ message: "Finanšu dokuments veiksmīgi dzēsts" });
  } catch (err) {
    console.error("Dzēšanas kļūda:", err);
    res.status(500).json({ message: "Neizdevās dzēst finanšu dokumentu" });
  }
};

export const bulkDeleteDocuments = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "Nav norādīti dokumentu ID" });

  try {
    await pool.query("DELETE FROM document_lines WHERE document_id = ANY($1)", [ids]);
    const result = await pool.query("DELETE FROM documents WHERE id = ANY($1) RETURNING *", [ids]);

    res.status(200).json({
      message: `Veiksmīgi dzēsti ${result.rowCount} dokumenti`,
      deletedCount: result.rowCount,
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ message: "Neizdevās dzēst dokumentus" });
  }
};

export const exportDocuments = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No document IDs provided" });
    }

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

    if (docs.length === 0) {
      return res.status(404).json({ error: "No documents found" });
    }

    const lineQuery = `
      SELECT *
      FROM document_lines
      WHERE document_id = ANY($1)
      ORDER BY id;
    `;

    const { rows: allLines } = await pool.query(lineQuery, [ids]);

    const linesMap = {};
    allLines.forEach((line) => {
      if (!linesMap[line.document_id]) linesMap[line.document_id] = [];
      linesMap[line.document_id].push(line);
    });

    const financialDocsXml = docs.map((doc) => {
      let DocPartnerName = "";
      let DocPartnerRegistrationNo = doc.partner_reg_nr || "";

      if (doc.partner_kind_name === "Fiziska persona") {
        DocPartnerName = `${doc.partner_title} ${doc.partner_name}`;
      } else {
        DocPartnerName = `${doc.partner_name}, ${doc.partner_title}`;
      }

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

    const builder = new Builder({ headless: false, xmldec: { version: "1.0", encoding: "UTF-8" } });
    const xml = builder.buildObject(xmlObj);

    res.setHeader("Content-Disposition", "attachment; filename=financial_documents.xml");
    res.setHeader("Content-Type", "application/xml");

    return res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export documents" });
  }
};
