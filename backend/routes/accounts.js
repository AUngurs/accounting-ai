import express from "express";
import {
  setAccounts,
  getAccounts,
  importAccounts,
} from "../controllers/accountsController.js";

const router = express.Router({ mergeParams: true });

router.post("/set", setAccounts);
router.get("/", getAccounts);
router.post("/import", importAccounts);

export default router;
