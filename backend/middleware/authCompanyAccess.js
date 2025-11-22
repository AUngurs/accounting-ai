import pool from "../db.js";

export const authCompanyAccess = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID not provided" });
    }

    const result = await pool.query(
      "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
      [companyId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    req.companyId = companyId;

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
