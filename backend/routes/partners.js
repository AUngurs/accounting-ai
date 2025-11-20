import express from "express";
import { getPartners, importPartners, deletePartner, bulkDeletePartners } from "../controllers/partnersController.js";

const router = express.Router();

router.get("/:company_id", getPartners);
router.post("/:company_id/import", importPartners);
router.delete("/:partner_id", deletePartner);
router.post("/bulk-delete", bulkDeletePartners);

export default router;
