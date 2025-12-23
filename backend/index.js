import express from "express";
import cors from "cors";
import path from "path";

// Ielādē ceļus (routes) no atsevišķiem failiem
import authRoutes from "./routes/auth.js";
import documentsRoutes from "./routes/documents.js";
import partnersRoutes from "./routes/partners.js";
import accountsRoutes from "./routes/accounts.js";
import userRoutes from "./routes/user.js";
import companiesRoutes from "./routes/companies.js";
import aiRoutes from "./routes/ai.js";

// Ielādē middleware autentifikācijai un piekļuves kontrolei
import { authenticateToken } from "./middleware/authToken.js";
import { authCompanyAccess } from "./middleware/authCompanyAccess.js";

// Izveido Express aplikāciju
const app = express();
const PORT = 5001;

// Iespējo CORS (cross-origin requests)
app.use(cors());

// Iespējo JSON datu pārveidošanu iekš request body
app.use(express.json());

// Dod statiskos failus no /uploads mapes
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);

// Middleware ķēde: autentifikācija
app.use("/api/user", authenticateToken, userRoutes);
app.use("/api/companies", authenticateToken, companiesRoutes);

// Middleware ķēde uzņēmuma līmenim: autentifikācija + uzņēmuma piekļuves pārbaude
app.use("/api/companies/:companyId", authenticateToken, authCompanyAccess, (req, res, next) => next());

app.use("/api/companies/:companyId/ai", aiRoutes);
app.use("/api/companies/:companyId/documents", documentsRoutes);
app.use("/api/companies/:companyId/partners", partnersRoutes);
app.use("/api/companies/:companyId/accounts", accountsRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
