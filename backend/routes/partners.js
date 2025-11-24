import express from "express";
import {
  getPartners,
  importPartners,
  editPartner,
  deletePartner,
  bulkDeletePartners,
} from "../controllers/partnersController.js";

const router = express.Router({ mergeParams: true });

router.get("/", getPartners);
router.post("/", importPartners);
router.put("/:partner_id", editPartner);
router.delete("/:partner_id", deletePartner);
router.post("/bulk-delete", bulkDeletePartners);

export default router;
