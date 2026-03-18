import pg from "pg";

// โหลด environment variables จาก .env
// บน Vercel จะใช้ environment variables จาก Dashboard อัตโนมัติ

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;