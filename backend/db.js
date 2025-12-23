import dotenv from "dotenv";
import pg from "pg";

// Ielādē vides konfigurācijas mainīgos no .env faila
dotenv.config();

const { Pool } = pg;

// Pielāgo datuma tipa (1082 = DATE) pārveidošanu, lai atgrieztu vērtību kā string, nevis JavaScript Date objektu
pg.types.setTypeParser(1082, (val) => val);

// Izveido savienojuma “pool” ar PostgreSQL datubāzi, izmantojot konfigurācijas no vides mainīgajiem
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

export default pool;
