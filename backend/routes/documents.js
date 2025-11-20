import express from "express";
import { getDocuments, importDocuments, deleteDocument, bulkDeleteDocuments } from "../controllers/documentsController.js";

const router = express.Router();

router.get("/:company_id", getDocuments);
router.post("/:company_id/import", importDocuments);
router.delete("/:document_id", deleteDocument);
router.post("/bulk-delete", bulkDeleteDocuments);

export default router;
