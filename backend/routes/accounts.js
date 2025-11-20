import express from "express";
import { setAccounts, getAccounts, importAccounts } from "../controllers/accountsController.js";

const router = express.Router();

router.post("/:company_id/set", setAccounts);
router.get("/:company_id", getAccounts);
router.post("/:company_id/import", importAccounts);

export default router;
