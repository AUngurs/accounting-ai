import express from "express";
import cors from "cors";

import pool from "./db.js";

import authRoutes from "./routes/auth.js";
import sidebarRoutes from "./routes/sidebar.js";
import documentsRoutes from "./routes/documents.js";
import partnersRoutes from "./routes/partners.js";
import accountsRoutes from "./routes/accounts.js";
import userRoutes from "./routes/user.js";
import companiesRoutes from "./routes/companies.js";
import { authenticateToken } from "./middleware/authToken.js";
import { authCompanyAccess } from "./middleware/authCompanyAccess.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Backend running"));

app.use("/api/auth", authRoutes);

app.use("/api/user", authenticateToken, userRoutes);

app.use("/api/companies", authenticateToken, companiesRoutes);

app.use(
  "/api/companies/:companyId",
  authenticateToken,
  authCompanyAccess,
  (req, res, next) => next()
);

app.use("/api/companies/:companyId/sidebar", sidebarRoutes);
app.use("/api/companies/:companyId/documents", documentsRoutes);
app.use("/api/companies/:companyId/partners", partnersRoutes);
app.use("/api/companies/:companyId/accounts", accountsRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
