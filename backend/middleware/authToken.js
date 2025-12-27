import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // Saņem Authorization header no requesta
  // Formāts ir: "Bearer <token>"
  const authHeader = req.headers["authorization"];

  // Ja header ir definēts, izņem token daļu (pēc "Bearer ")
  const token = authHeader && authHeader.split(" ")[1];

  // Ja tokena nav, lietotājs nav autentificēts
  if (!token) {
    return res.status(401).json({ error: "Neparedzēta servera kļūda" });
  }

  // Verificē tokenu ar servera slepeno atslēgu
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // 403 nozīmē, ka token ir nederīgs vai beidzies derīguma termiņš
      return res.status(403).json({ error: "Neparedzēta servera kļūda" });
    }

    // Saglabā lietotāja datus request objektā, lai turpmākie endpointi varētu zināt, kurš lietotājs pieprasa
    req.user = user;
    next();
  });
};
