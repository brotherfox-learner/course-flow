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
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const auth = await ensureAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message })
  }

  try {
    const {
      id,
      code,
      name,
      discount_type,
      discount_value,
      min_price,
      max_uses,
      valid_from,
      valid_until,
    } = req.body

    // Validate required fields
    if (!id || !code || !name || !discount_type || discount_value == null) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Validate discount type
    if (!["thb", "percent"].includes(discount_type)) {
      return res.status(400).json({ message: "Invalid discount type" })
    }

    // Validate discount value
    const parsedValue = parseFloat(discount_value)
    if (isNaN(parsedValue) || parsedValue <= 0) {
      return res.status(400).json({ message: "Invalid discount value" })
    }

    // Validate min_price and max_uses
    const parsedMinPrice = min_price ? parseFloat(min_price) : null
    const parsedMaxUses = max_uses ? parseInt(max_uses) : null

    if (parsedMinPrice !== null && (isNaN(parsedMinPrice) || parsedMinPrice < 0)) {
      return res.status(400).json({ message: "Invalid minimum price" })
    }

    if (parsedMaxUses !== null && (isNaN(parsedMaxUses) || parsedMaxUses <= 0)) {
      return res.status(400).json({ message: "Invalid maximum uses" })
    }

    // Check if promo code exists
    const existingCheck = await pool.query(
      "SELECT id FROM promo_codes WHERE id = $1",
      [id]
    )

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ message: "Promo code not found" })
    }

    // Check if code is already used by another promo code
    const codeCheck = await pool.query(
      "SELECT id FROM promo_codes WHERE code = $1 AND id != $2",
      [code, id]
    )

    if (codeCheck.rows.length > 0) {
      return res.status(400).json({ message: "Promo code already exists" })
    }

    // Update promo code
    const updateResult = await pool.query(
      `UPDATE promo_codes 
       SET code = $1, name = $2, discount_type = $3, discount_value = $4, 
           min_price = $5, max_uses = $6, valid_from = $7, valid_until = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        code,
        name,
        discount_type,
        parsedValue,
        parsedMinPrice,
        parsedMaxUses,
        valid_from || null,
        valid_until || null,
        id,
      ]
    )

    return res.status(200).json({
      message: "Promo code updated successfully",
      promoCode: updateResult.rows[0],
    })

  } catch (error) {
    console.error("Update promo code error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
