import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function ensureAdmin(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" }
  }

  const token = authHeader.split(" ")[1]
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return { ok: false, status: 401, message: "Invalid token" }
  }

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [
    user.id,
  ])

  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return { ok: false, status: 403, message: "Forbidden" }
  }

  return { ok: true, user }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const auth = await ensureAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message })
  }

  try {
    const result = await pool.query(
      `SELECT
        id,
        code,
        name,
        discount_type,
        discount_value,
        min_price,
        max_uses,
        valid_from,
        valid_until,
        created_at,
        CASE
          WHEN valid_until IS NOT NULL AND valid_until < NOW() THEN 'expired'
          WHEN valid_from IS NOT NULL AND valid_from > NOW() THEN 'inactive'
          ELSE 'active'
        END AS status,
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.promo_code_id = p.id) AS used_count
      FROM promo_codes p
      ORDER BY created_at DESC`
    )

    return res.status(200).json({ promoCodes: result.rows })
  } catch (error) {
    console.error("Fetch promo codes error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
