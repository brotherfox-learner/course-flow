import pool from "@/infrastructure/db"
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

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ message: "Course ID is required" })
  }

  try {
    const result = await pool.query(
      `SELECT
        p.id,
        p.code,
        p.name,
        p.discount_type,
        p.discount_value,
        p.min_price,
        p.max_uses,
        p.valid_from,
        p.valid_until,
        p.created_at,
        CASE
          WHEN p.valid_until IS NOT NULL AND p.valid_until < NOW() THEN 'expired'
          WHEN p.valid_from IS NOT NULL AND p.valid_from > NOW() THEN 'inactive'
          ELSE 'active'
        END AS status,
        (SELECT COUNT(*)::int FROM promo_code_usages u WHERE u.promo_code_id = p.id) AS used_count
      FROM promo_codes p
      INNER JOIN promo_code_courses pcc ON pcc.promo_code_id = p.id AND pcc.course_id = $1
      ORDER BY p.created_at DESC`,
      [id]
    )

    return res.status(200).json({ promoCodes: result.rows })
  } catch (error) {
    console.error("Fetch course promocodes error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
