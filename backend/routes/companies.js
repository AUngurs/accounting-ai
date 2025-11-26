import express from "express";
import { getCompanies, addCompany, editCompany, deleteCompany } from "../controllers/companyController.js";

const router = express.Router();

router.get("/", getCompanies);
router.post("/", addCompany);
router.put("/:companyId", editCompany);
router.delete("/:companyId", deleteCompany);

export default router;
