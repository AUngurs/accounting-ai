import pool from "../db.js";
import bcrypt from "bcryptjs";

export const editUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    let result;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      result = await pool.query(
        `UPDATE users
            SET username = $1,
            password = $2
            WHERE id = $3
            RETURNING *`,
        [username.trim(), hashedPassword, userId]
      );
    } else {
      result = await pool.query(
        `UPDATE users
            SET username = $1
            WHERE id = $2
            RETURNING *`,
        [username.trim(), userId]
      );
    }

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
