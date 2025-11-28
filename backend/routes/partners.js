import express from "express";
import {
  getPartners,
  importPartners,
  createPartner,
  editPartner,
  deletePartner,
  bulkDeletePartners,
  exportPartners,
} from "../controllers/partnersController.js";

const router = express.Router({ mergeParams: true });

router.get("/", getPartners);
router.post("/import", importPartners);
router.post("/", createPartner);
router.put("/:partner_id", editPartner);
router.delete("/:partner_id", deletePartner);
router.post("/bulk-delete", bulkDeletePartners);
router.post("/export", exportPartners);

export default router;
