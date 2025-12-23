import express from "express";
import { register, login } from "../controllers/authController.js";
import { body } from "express-validator";

const router = express.Router();

// Papildus validācija tiek veikta, izmantojot express-validator
router.post(
  "/register",
  body("email").isEmail(),
  body("username").notEmpty().isLength({ min: 3, max: 20 }),
  body("password").isLength({ min: 8, max: 64 }),
  body("repeatPassword").notEmpty(),
  register
);

router.post("/login", login);

export default router;
