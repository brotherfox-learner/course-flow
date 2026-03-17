import pg from "pg";

// โหลด environment variables จาก .env
// บน Vercel จะใช้ environment variables จาก Dashboard อัตโนมัติ

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

export default pool;