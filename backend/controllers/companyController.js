import pool from "../db.js";

export const getCompanies = async (req, res) => {
  try {
    // Lietotāja ID tiek iegūts no autentifikācijas middleware
    const userId = req.user.userId;

    // Atgriež tikai lietotāja uzņēmumus, sakārtotus pēc nosaukuma
    const result = await pool.query("SELECT id, name FROM companies WHERE user_id = $1 ORDER BY name", [userId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

export const addCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    // Ievieto jaunu uzņēmumu un atgriež tā ID un nosaukumu
    const result = await pool.query("INSERT INTO companies (name, user_id) VALUES ($1, $2) RETURNING id, name", [name, userId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

export const editCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    const companyId = req.params.companyId;
    const { name } = req.body;

    // Atjaunina uzņēmumu, kas pieder konkrētajam lietotājam
    const result = await pool.query(
      `UPDATE companies
       SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name`,
      [name, companyId, userId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};

export const deleteCompany = async (req, res) => {
  const companyId = req.params.companyId;

  try {
    // Dzēš uzņēmumu pēc ID
    const result = await pool.query("DELETE FROM companies WHERE id = $1 RETURNING *", [companyId]);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};
