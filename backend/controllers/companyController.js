import pool from "../db.js";

export const getCompanies = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query("SELECT id, name FROM companies WHERE user_id = $1", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const addCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }

    const result = await pool.query("INSERT INTO companies (name, user_id) VALUES ($1, $2) RETURNING id, name", [
      name.trim(),
      userId,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
