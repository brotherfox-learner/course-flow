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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const auth = await ensureAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message })
  }

  const {
    code,
    name,
    discount_type,
    discount_value,
    min_price,
    max_uses,
    valid_from,
    valid_until,
  } = req.body

  if (!code || !discount_type || discount_value == null || !valid_from || !valid_until) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  if (!["fixed", "percent"].includes(discount_type)) {
    return res.status(400).json({ message: "Invalid discount_type" })
  }

  const validFromDate = new Date(valid_from)
  const validUntilDate = new Date(valid_until)
  if (Number.isNaN(validFromDate.getTime()) || Number.isNaN(validUntilDate.getTime())) {
    return res.status(400).json({ message: "Invalid valid_from/valid_until date" })
  }
  if (validUntilDate < validFromDate) {
    return res.status(400).json({ message: "valid_until must be later than valid_from" })
  }

  try {
    const result = await pool.query(
      `INSERT INTO promo_codes (
        code,
        name,
        discount_type,
        discount_value,
        min_price,
        max_uses,
        valid_from,
        valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, code, name, discount_type, discount_value, min_price, max_uses, valid_from, valid_until, created_at`,
      [
        code.trim().toUpperCase(),
        name?.trim() || code.trim().toUpperCase(),
        discount_type,
        Number(discount_value),
        min_price != null && min_price !== "" ? Number(min_price) : null,
        max_uses != null && max_uses !== "" ? Number(max_uses) : null,
        valid_from,
        valid_until,
      ]
    )

    return res.status(201).json({ promoCode: result.rows[0] })
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Promo code already exists" })
    }
    console.error("Create promo code error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
