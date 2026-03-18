import pool from "@/infrastructure/db"
import { createClient } from "@supabase/supabase-js"
import { toBangkokStartOfDay, toBangkokEndOfDay } from "@/shared/utils/promoCodeDates"

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

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
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
    /* course_ids: [] = all courses, [...ids] = specific courses only */
    course_ids,
  } = req.body

  if (!code || !discount_type || discount_value == null || !valid_from || !valid_until) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  if (!["fixed", "percent"].includes(discount_type)) {
    return res.status(400).json({ message: "Invalid discount_type" })
  }

  const parsedDiscountValue = Number(discount_value)
  const parsedMinPrice =
    min_price != null && min_price !== "" ? Number(min_price) : 0
  const parsedMaxUses =
    max_uses != null && max_uses !== "" ? Number(max_uses) : null

  if (!Number.isFinite(parsedDiscountValue) || parsedDiscountValue <= 0) {
    return res.status(400).json({ message: "Discount value must be greater than 0" })
  }

  if (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0) {
    return res.status(400).json({ message: "Minimum purchase cannot be negative" })
  }

  if (parsedMaxUses != null && (!Number.isInteger(parsedMaxUses) || parsedMaxUses < 1)) {
    return res.status(400).json({ message: "Usage limit must be a positive integer" })
  }

  // Omise: minimum charge 20 THB. Min amount after discount must be >= 20.
  // Use round to avoid floating point issues (e.g. 100 * 0.2 = 19.999999999999996)
  const OMISE_MIN = 20
  if (discount_type === "fixed") {
    const minAfterDiscount = parsedMinPrice - parsedDiscountValue
    if (minAfterDiscount < OMISE_MIN) {
      return res.status(400).json({
        message: "Minimum purchase minus discount must be at least 20 THB (Omise requirement)",
      })
    }
  } else {
    // percent: min_price * (1 - discount/100) >= 20
    const minAfterDiscount = Math.round(parsedMinPrice * (1 - parsedDiscountValue / 100) * 100) / 100
    if (parsedDiscountValue < 100 && minAfterDiscount < OMISE_MIN) {
      return res.status(400).json({
        message: "Minimum purchase after discount must be at least 20 THB (Omise requirement)",
      })
    }
    if (parsedDiscountValue >= 100) {
      return res.status(400).json({ message: "Discount percentage cannot be 100% or more" })
    }
  }

  const validFromStr = toBangkokStartOfDay(valid_from)
  const validUntilStr = toBangkokEndOfDay(valid_until)
  const validFromDate = validFromStr ? new Date(validFromStr) : null
  const validUntilDate = validUntilStr ? new Date(validUntilStr) : null
  if (!validFromDate || !validUntilDate || Number.isNaN(validFromDate.getTime()) || Number.isNaN(validUntilDate.getTime())) {
    return res.status(400).json({ message: "Invalid valid_from/valid_until date" })
  }
  if (validUntilDate < validFromDate) {
    return res.status(400).json({ message: "Valid until must be later than valid from" })
  }

  /* Normalise course_ids: null / undefined / [] all mean "all courses" */
  const courseIds = Array.isArray(course_ids) && course_ids.length > 0
    ? course_ids.map(Number).filter(Boolean)
    : []

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const result = await client.query(
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
        parsedDiscountValue,
        parsedMinPrice,
        parsedMaxUses,
        validFromStr,
        validUntilStr,
      ]
    )

    const promoCode = result.rows[0]

    /* Insert course restrictions only when specific courses are selected */
    if (courseIds.length > 0) {
      const values = courseIds
        .map((_, i) => `($1, $${i + 2})`)
        .join(", ")
      await client.query(
        `INSERT INTO promo_code_courses (promo_code_id, course_id) VALUES ${values}`,
        [promoCode.id, ...courseIds]
      )
    }

    await client.query("COMMIT")

    return res.status(201).json({
      promoCode: {
        ...promoCode,
        course_ids: courseIds,
      },
    })
  } catch (error) {
    await client.query("ROLLBACK")
    if (error.code === "23505") {
      return res.status(409).json({ message: "Promo code already exists" })
    }
    console.error("Create promo code error:", error)
    return res.status(500).json({ message: "Internal server error" })
  } finally {
    client.release()
  }
}
