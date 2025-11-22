import express from "express";
import { getSidebar } from "../controllers/sidebarController.js";

const router = express.Router();

router.get("/", getSidebar);

export default router;
