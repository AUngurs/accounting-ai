import pool from "../db.js";

export const getSidebar = async (req, res) => {
    try {
        const userID = req.params.id;

        const userResult = await pool.query(
            "SELECT id, email, username FROM users WHERE id = $1",
            [userID]
        );

        const companiesResult = await pool.query(
            "SELECT id, name FROM companies WHERE user_id = $1",
            [userID]
        );

        res.json({
            users: userResult.rows[0],
            companies: companiesResult.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};