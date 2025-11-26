import express from "express";
import {
  getDocuments,
  importDocuments,
  editDocument,
  deleteDocument,
  bulkDeleteDocuments,
  getLines,
  editLines,
} from "../controllers/documentsController.js";

const router = express.Router({ mergeParams: true });

router.get("/", getDocuments);
router.post("/", importDocuments);
router.put("/:document_id", editDocument);
router.get("/:document_id/lines", getLines);
router.put("/:document_id/lines", editLines);
router.delete("/:document_id", deleteDocument);
router.post("/bulk-delete", bulkDeleteDocuments);

export default router;
