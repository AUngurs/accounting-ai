import pool from "../db.js";
import bcrypt from "bcryptjs";

export const editUser = async (req, res) => {
  try {
    const userId = req.user.userId; // Lietotāja ID no autentifikācijas middleware
    const { username, password } = req.body;

    // Username obligāts, atgriež kļūdu, ja tukšs
    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    let result;

    if (password) {
      // Ja norādīta parole, to hashē ar bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Atjaunina gan username, gan password
      result = await pool.query(
        `UPDATE users
            SET username = $1,
                password = $2
            WHERE id = $3
            RETURNING id, email, username`,
        [username.trim(), hashedPassword, userId]
      );
    } else {
      // Atjaunina tikai username
      result = await pool.query(
        `UPDATE users
            SET username = $1
            WHERE id = $2
            RETURNING id, email, username`,
        [username.trim(), userId]
      );
    }

    // Ja lietotājs neeksistē, atgriež 404
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Dzēš lietotāju un atgriež dzēsto rindu
    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id, email, username`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User deleted successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
