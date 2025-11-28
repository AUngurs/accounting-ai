import express from "express";
import {
  getDocuments,
  importDocuments,
  getDocument,
  editDocument,
  updateDocumentAccounted,
  deleteDocument,
  bulkDeleteDocuments,
  getLines,
  editLines,
  exportDocuments,
} from "../controllers/documentsController.js";

const router = express.Router({ mergeParams: true });

router.get("/", getDocuments);
router.post("/", importDocuments);
router.get("/:document_id", getDocument);
router.put("/:document_id", editDocument);
router.put("/:document_id/accounted", updateDocumentAccounted);
router.get("/:document_id/lines", getLines);
router.put("/:document_id/lines", editLines);
router.delete("/:document_id", deleteDocument);
router.post("/bulk-delete", bulkDeleteDocuments);
router.post("/export", exportDocuments);

export default router;
