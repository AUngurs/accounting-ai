import express from "express";
import multer from "multer";
import { importPdf } from "../controllers/aiController.js";

const router = express.Router();

// Augšupielādētie faili tiek turēti atmiņā kā buferi, nevis saglabāti diskā
const upload = multer({ storage: multer.memoryStorage() });

// upload.single("pdf") apstrādā vienu failu ar beigu nosaukumu "pdf"
router.post("/import-pdf", upload.single("pdf"), importPdf);

export default router;
