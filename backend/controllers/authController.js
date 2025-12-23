import bcrypt from "bcryptjs";
import pool from "../db.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  // Pārbauda validācijas kļūdas no express-validator middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Lietotāja ievades dati
  const { email, username, password, repeatPassword } = req.body;

  try {
    // Paroles tiek salīdzinātas
    if (password !== repeatPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Pārbauda, vai lietotājs ar šādu e-pastu jau eksistē
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Parole tiek šifrēta pirms saglabāšanas datubāzē
    const hashedPassword = await bcrypt.hash(password, 10);

    // Jaunais lietotājs tiek saglabāts datubāzē, RETURNING ļauj uzreiz atgriezt lietotāja datus
    const result = await pool.query("INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username", [
      email,
      username,
      hashedPassword,
    ]);

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  // Pārbauda validācijas kļūdas no express-validator middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Meklē lietotāju pēc e-pasta
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    const user = userResult.rows[0];

    // Netiek norādīts, vai kļūda ir e-pastā vai parolē (drošības apsvērumu dēļ)
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Salīdzina ievadīto paroli ar datubāzē saglabāto hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // JWT tokens satur minimālu informāciju, kas nepieciešama lietotāja autentifikācijai
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "12h" } // tokens derīgs 12 stundas
    );

    // Atgriež tokenu un lietotāja pamatinformāciju frontendam
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
