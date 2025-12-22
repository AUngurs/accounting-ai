import pool from "../db.js";
import fs from "fs";
import XLSX from "xlsx";
import multer from "multer";

// Jumis noklusējuma kontu plāns
import defaultAccounts from "../../frontend/src/data/defaultAccounts.js";

// XLSX apstrādei nepieciešams reāls faila ceļš, tāpēc fails tiek saglabāts lokāli
const upload = multer({ dest: "uploads/" });

export const setAccounts = async (req, res) => {
  try {
    // Uzņēmuma identifikators tiek padots kā URL parametrs
    const companyID = req.params.companyId;

    // Pašreizējais kontu plāns tiek dzēsts
    await pool.query("DELETE FROM accounts WHERE company_id = $1", [companyID]);

    // Ievieto visus noklusējuma kontus konkrētajam uzņēmumam
    for (const acc of defaultAccounts) {
      await pool.query(
        `INSERT INTO accounts (company_id, code, name, type, category)
         VALUES ($1, $2, $3, $4, $5)`,
        [companyID, acc.code, acc.name, acc.type, acc.category]
      );
    }

    // Konti tiek atgriezti sakārtoti pēc koda
    const result = await pool.query("SELECT * FROM accounts WHERE company_id = $1 ORDER BY code", [companyID]);

    res.json({ accounts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const companyID = req.params.companyId;

    // Konti tiek atgriezti sakārtoti pēc koda
    const accountsResult = await pool.query("SELECT * FROM accounts WHERE company_id = $1 ORDER BY code", [companyID]);

    res.json(accountsResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const editAccount = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { code, name, type, category } = req.body;

    // Visi lauki ir obligāti
    if (!code || !name || !type || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // RETURNING * ļauj uzreiz atgriezt atjaunināto kontu
    const result = await pool.query(
      `UPDATE accounts
       SET code = $1,
           name = $2,
           type = $3,
           category = $4
       WHERE id = $5
       RETURNING *`,
      [code, name, type, category, account_id]
    );

    // Ja netika atjaunināta neviena rinda, konts ar šādu ID neeksistē
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteAccount = async (req, res) => {
  const { account_id } = req.params;

  try {
    // RETURNING tiek izmantots, lai varētu noteikt, vai konts vispār eksistēja
    const result = await pool.query("DELETE FROM accounts WHERE id = $1 RETURNING *", [account_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: "Account successfully deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const importAccounts = [
  upload.single("xlsxFile"),

  async (req, res) => {
    try {
      const companyID = req.params.companyId;

      // XLSX fails ir obligāts
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // XLSX fails tiek nolasīts no pagaidu mapes
      const workbook = XLSX.readFile(req.file.path);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // header: 1 nodrošina elastību dažādiem Excel formātiem,
      // jo kolonnas tiek lasītas pēc indeksa, nevis nosaukuma
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1); // izlaiž virsraksta rindu

      const accounts = rows.map((row) => {
        const codeAndName = row[0]?.toString().trim() || "";
        const type = row[1]?.toString().trim() || "";
        const category = row[2]?.toString().trim() || "";

        // Konta kods un nosaukums ir vienā kolonnā
        const firstSpace = codeAndName.indexOf(" ");

        return {
          code: firstSpace > 0 ? codeAndName.slice(0, firstSpace) : codeAndName,
          name: firstSpace > 0 ? codeAndName.slice(firstSpace + 1) : "",
          type,
          category,
        };
      });

      // Esošie konti tiek dzēsti
      await pool.query("DELETE FROM accounts WHERE company_id = $1", [companyID]);

      // Jaunie konti tiek ievietoti
      for (const acc of accounts) {
        await pool.query(
          `INSERT INTO accounts (company_id, code, name, type, category)
           VALUES ($1, $2, $3, $4, $5)`,
          [companyID, acc.code, acc.name, acc.type, acc.category]
        );
      }

      // Pagaidu fails vairs nav vajadzīgs pēc importa
      fs.unlinkSync(req.file.path);

      // Konti tiek atgriezti sakārtoti pēc koda
      const result = await pool.query("SELECT * FROM accounts WHERE company_id = $1 ORDER BY code", [companyID]);

      res.json({ accounts: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];
