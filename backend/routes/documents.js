import express from "express";
import { getDocuments, importDocuments, deleteDocument, bulkDeleteDocuments, getLines } from "../controllers/documentsController.js";

const router = express.Router({ mergeParams: true });

router.get("/", getDocuments);
router.post("/", importDocuments);
router.get("/:document_id/lines", getLines);
router.delete("/:document_id", deleteDocument);
router.post("/bulk-delete", bulkDeleteDocuments);

export default router;
