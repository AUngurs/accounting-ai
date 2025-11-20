import express from "express";
import cors from "cors";

import pool from "./db.js";

import sidebarRoutes from "./routes/sidebar.js";
import documentsRoutes from "./routes/documents.js";
import partnersRoutes from "./routes/partners.js";
import accountsRoutes from "./routes/accounts.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Backend running"));

app.use("/api/sidebar", sidebarRoutes);
app.use("/api/docs", documentsRoutes);
app.use("/api/partners", partnersRoutes);
app.use("/api/accounts", accountsRoutes);

app.get("/test-db", async (req, res) => {
  try {
    const users = await pool.query("SELECT * FROM users");
    const companies = await pool.query("SELECT * FROM companies");
    const accounts = await pool.query("SELECT * FROM accounts");
    const partners = await pool.query("SELECT * FROM partners");
    const documents = await pool.query("SELECT * FROM documents");
    const document_lines = await pool.query("SELECT * FROM document_lines");

    res.json({ 
      users: users.rows, 
      companies: companies.rows,
      accounts: accounts.rows,
      partners: partners.rows,
      documents: documents.rows,
      document_lines: document_lines.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
