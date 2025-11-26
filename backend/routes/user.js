import express from "express";
import { editUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

router.put("/:userId", editUser);
router.delete("/:userId", deleteUser);

export default router;
