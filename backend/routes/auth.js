import express from "express";
import { register, login } from "../controllers/authController.js";
import { body } from "express-validator";

const router = express.Router();

router.post(
  "/register",
  body("email").isEmail(),
  body("username").notEmpty().isLength({ min: 3 }),
  body("password").isLength({ min: 6 }),
  body("repeatPassword").notEmpty(),
  register
);

router.post("/login", login);

export default router;
