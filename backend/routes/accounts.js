import express from "express";
import {
  setAccounts,
  getAccounts,
  editAccount,
  importAccounts,
  deleteAccount,
} from "../controllers/accountsController.js";

const router = express.Router({ mergeParams: true });

router.post("/set", setAccounts);
router.get("/", getAccounts);
router.put("/:account_id", editAccount);
router.delete("/:account_id", deleteAccount);
router.post("/import", importAccounts);

export default router;
