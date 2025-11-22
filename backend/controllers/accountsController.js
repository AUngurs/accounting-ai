import pool from "../db.js";
import fs from "fs";
import XLSX from "xlsx";
import multer from "multer";

import defaultAccounts from "../../frontend/src/data/defaultAccounts.js";

const upload = multer({ dest: "uploads/" });

export const setAccounts = async (req, res) => {
  try {
    const companyID = req.params.companyId;
    await pool.query("DELETE FROM accounts WHERE company_id = $1", [companyID]);

    for (const acc of defaultAccounts) {
      await pool.query(
        `INSERT INTO accounts (company_id, code, name, type, category)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (company_id, code) DO UPDATE
                SET name = EXCLUDED.name,
                    type = EXCLUDED.type,
                    category = EXCLUDED.category`,
        [companyID, acc.code, acc.name, acc.type, acc.category]
      );
    }

    const result = await pool.query(
      "SELECT * FROM accounts WHERE company_id = $1 ORDER BY code",
      [companyID]
    );

    res.json({ accounts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const companyID = req.params.companyId;
    const accountsResult = await pool.query(
      "SELECT * FROM accounts WHERE company_id = $1",
      [companyID]
    );
    res.json(accountsResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const importAccounts = [
  upload.single("xlsxFile"),
  async (req, res) => {
    try {
      const companyID = req.params.companyId;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const dataRows = rows.slice(1);

      const accounts = dataRows.map((row) => {
        const codeAndName = row[0]?.toString().trim() || "";
        const type = row[1]?.toString().trim() || "";
        const category = row[2]?.toString().trim() || "";

        const firstSpace = codeAndName.indexOf(" ");
        const code =
          firstSpace > 0 ? codeAndName.slice(0, firstSpace) : codeAndName;
        const name = firstSpace > 0 ? codeAndName.slice(firstSpace + 1) : "";

        return { code, name, type, category };
      });

      for (const acc of accounts) {
        await pool.query(
          `INSERT INTO accounts (company_id, code, name, type, category)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (company_id, code) DO UPDATE
           SET name = EXCLUDED.name,
               type = EXCLUDED.type,
               category = EXCLUDED.category`,
          [companyID, acc.code, acc.name, acc.type, acc.category]
        );
      }

      fs.unlinkSync(req.file.path);

      const result = await pool.query(
        "SELECT * FROM accounts WHERE company_id = $1 ORDER BY code",
        [companyID]
      );

      res.json({ accounts: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to import accounts" });
    }
  },
];
