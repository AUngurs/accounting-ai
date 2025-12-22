import pool from "../db.js";

export const getCompanies = async (req, res) => {
  try {
    // Lietotāja ID tiek iegūts no autentifikācijas middleware
    const userId = req.user.userId;

    // Atgriež tikai lietotāja uzņēmumus, sakārtotus pēc nosaukuma
    const result = await pool.query("SELECT id, name FROM companies WHERE user_id = $1 ORDER BY name", [userId]);

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

    // Pārbauda, vai nosaukums ir ievadīts un nav tikai tukšas vietas
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }

    // Ievieto jaunu uzņēmumu un atgriež tā ID un nosaukumu
    const result = await pool.query("INSERT INTO companies (name, user_id) VALUES ($1, $2) RETURNING id, name", [name.trim(), userId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const editCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    const companyId = req.params.companyId;
    const { name } = req.body;

    // Pārbauda, vai nosaukums ir ievadīts un nav tikai tukšas vietas
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }

    // Atjaunina tikai tos uzņēmumus, kas pieder konkrētajam lietotājam, RETURNING ļauj uzreiz atgriezt atjaunināto ierakstu
    const result = await pool.query(
      `UPDATE companies
       SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name`,
      [name.trim(), companyId, userId]
    );

    // Ja rowCount === 0, uzņēmums ar šādu ID nepieder lietotājam vai neeksistē
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    // Dzēš uzņēmumu pēc ID, RETURNING tiek izmantots, lai zinātu, vai ieraksts vispār eksistēja
    const result = await pool.query("DELETE FROM companies WHERE id = $1 RETURNING *", [companyId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Company successfully deleted" });
  } catch (err) {
    console.error("Dzēšanas kļūda:", err);
    res.status(500).json({ message: "Server error" });
  }
};
