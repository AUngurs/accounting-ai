import express from "express";
import multer from "multer";
import { importPdf } from "../controllers/aiController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import-pdf", upload.single("pdf"), importPdf);

export default router;
