import express from "express";
import { getSidebar } from "../controllers/sidebarController.js";

const router = express.Router();

router.get("/:id", getSidebar);

export default router;
