import express from "express";
import multer from "multer";
import {
  getDocuments,
  createDocument,
  importXmlDocuments,
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
const upload = multer({ dest: "uploads/" });

router.get("/", getDocuments);
router.post("/", upload.single("file"), createDocument);
router.post("/importxml", importXmlDocuments);
router.get("/:document_id", getDocument);
router.put("/:document_id", editDocument);
router.put("/:document_id/accounted", updateDocumentAccounted);
router.get("/:document_id/lines", getLines);
router.put("/:document_id/lines", editLines);
router.delete("/:document_id", deleteDocument);
router.post("/bulk-delete", bulkDeleteDocuments);
router.post("/export", exportDocuments);

export default router;
