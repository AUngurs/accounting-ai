import pool from "../db.js";

export const authCompanyAccess = async (req, res, next) => {
  try {
    // Iegūst uzņēmuma ID no URL parametra
    const { companyId } = req.params;

    // Ja parametra nav, request ir nederīgs
    if (!companyId) {
      return res.status(400).json({ error: "Neparedzēta servera kļūda" });
    }

    // Pārbauda, vai šis uzņēmums pieder autentificētajam lietotājam
    // Šeit tiek izmantots userId, kas iepriekš pievienots req objektam middleware stadijā (authenticateToken no authToken.js)
    const result = await pool.query("SELECT * FROM companies WHERE id = $1 AND user_id = $2", [companyId, req.user.userId]);

    // Ja rowCount === 0, lietotājam nav piekļuves šim uzņēmumam
    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Neparedzēta servera kļūda" });
    }

    // Saglabā uzņēmuma ID request objektā, lai nākamie endpointi varētu to izmantot
    req.companyId = companyId;

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};
