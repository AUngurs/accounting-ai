import pool from "../db.js";
import fs from "fs";
import { parseStringPromise } from "xml2js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

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
      const result = await parseStringPromise(xmlData, {
        explicitArray: false,
      });

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
            (company_id, partner_id, doc_id, doc_date, doc_type_abbrev, doc_group_abbrev, doc_currency, doc_amount, doc_comments)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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

        if (doc.FinancialDocLine) {
          const lines = Array.isArray(doc.FinancialDocLine) ? doc.FinancialDocLine : [doc.FinancialDocLine];

          for (const line of lines) {
            const lineQuery = `
                INSERT INTO document_lines
                (document_id, line_supplementary_notice, line_currency, line_amount, line_debet_account, line_credit_account, line_vat_rate, line_comments)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `;

            await pool.query(lineQuery, [
              insertedDoc.id,
              line.LineSupplementaryNoticeID,
              line.LineCurrency,
              parseFloat(line.LineAmount),
              line.LineDebetAccountCode || null,
              line.LineCreditAccountCode || null,
              line.LineVatRate || null,
              line.LineComments || null,
            ]);
          }
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

export const deleteDocument = async (req, res) => {
  const { document_id } = req.params;
  try {
    await pool.query("DELETE FROM document_lines WHERE document_id = $1", [document_id]);

    const result = await pool.query("DELETE FROM documents WHERE id = $1 RETURNING *", [document_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Finanšu dokuments nav atrasts" });
    }

    res.status(200).json({ message: "Finanšu dokuments veiksmīgi dzēsts" });
  } catch (err) {
    console.error("Dzēšanas kļūda:", err);
    res.status(500).json({ message: "Neizdevās dzēst finanšu dokumentu" });
  }
};

export const bulkDeleteDocuments = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Nav norādīti dokumentu ID" });
  }

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
