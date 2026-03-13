import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"
import { toBangkokStartOfDay, toBangkokEndOfDay } from "@/utils/promoCodeDates"

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
  // Get promo code ID from URL
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: "Promo code ID is required" })
  }

  const auth = await ensureAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message })
  }

  try {
    switch (req.method) {
      case "GET": {
        // Get single promo code by ID
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
          WHERE p.id = $1`,
          [id]
        )

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Promo code not found" })
        }

        const promoCode = result.rows[0]

        // Fetch course_ids from promo_code_courses for "some" courses restriction
        const courseIdsResult = await pool.query(
          `SELECT course_id FROM promo_code_courses WHERE promo_code_id = $1 ORDER BY course_id`,
          [id]
        )
        promoCode.course_ids = courseIdsResult.rows.map((r) => r.course_id)

        return res.status(200).json({ promoCode })
      }

      case "PUT": {
        // Update promo code
        const {
          code,
          name,
          discount_type,
          discount_value,
          min_price,
          max_uses,
          valid_from,
          valid_until,
          course_ids,
        } = req.body

        // Validate required fields
        if (!code || !name || !discount_type || discount_value == null) {
          return res.status(400).json({ message: "Missing required fields" })
        }

        // Validate discount type
        if (!["fixed", "percent"].includes(discount_type)) {
          return res.status(400).json({ message: "Invalid discount type" })
        }

        // Validate discount value
        const parsedValue = parseFloat(discount_value)
        if (isNaN(parsedValue) || parsedValue <= 0) {
          return res.status(400).json({ message: "Discount value must be greater than 0" })
        }

        // Validate min_price and max_uses
        const parsedMinPrice = min_price != null && min_price !== "" ? parseFloat(min_price) : 0
        const parsedMaxUses = max_uses != null && max_uses !== "" ? parseInt(max_uses) : null

        if (parsedMinPrice < 0) {
          return res.status(400).json({ message: "Minimum purchase cannot be negative" })
        }

        if (parsedMaxUses !== null && (isNaN(parsedMaxUses) || parsedMaxUses < 1)) {
          return res.status(400).json({ message: "Usage limit must be a positive integer" })
        }

        // Omise: minimum charge 20 THB. Min amount after discount must be >= 20.
        // Use round to avoid floating point issues (e.g. 100 * 0.2 = 19.999999999999996)
        const OMISE_MIN = 20
        if (discount_type === "fixed") {
          const minAfterDiscount = parsedMinPrice - parsedValue
          if (minAfterDiscount < OMISE_MIN) {
            return res.status(400).json({
              message: "Minimum purchase minus discount must be at least 20 THB (Omise requirement)",
            })
          }
        } else {
          const minAfterDiscount = Math.round(parsedMinPrice * (1 - parsedValue / 100) * 100) / 100
          if (parsedValue < 100 && minAfterDiscount < OMISE_MIN) {
            return res.status(400).json({
              message: "Minimum purchase after discount must be at least 20 THB (Omise requirement)",
            })
          }
          if (parsedValue >= 100) {
            return res.status(400).json({ message: "Discount percentage cannot be 100% or more" })
          }
        }

        // Convert dates to Bangkok timezone (valid_from 00:00, valid_until 23:59)
        const validFromStr = valid_from ? toBangkokStartOfDay(valid_from) : null
        const validUntilStr = valid_until ? toBangkokEndOfDay(valid_until) : null
        if (valid_from && valid_until) {
          const fromDate = new Date(validFromStr)
          const untilDate = new Date(validUntilStr)
          if (fromDate > untilDate) {
            return res.status(400).json({ message: "Valid until must be later than valid from" })
          }
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

        const client = await pool.connect()
        try {
          await client.query("BEGIN")

          // Update promo code
          const updateResult = await client.query(
            `UPDATE promo_codes 
             SET code = $1, name = $2, discount_type = $3, discount_value = $4, 
                 min_price = $5, max_uses = $6, valid_from = $7, valid_until = $8
             WHERE id = $9
             RETURNING *`,
            [
              code,
              name,
              discount_type,
              parsedValue,
              parsedMinPrice,
              parsedMaxUses,
              validFromStr || null,
              validUntilStr || null,
              id,
            ]
          )

          // Update course restrictions if course_ids is provided
          if (course_ids !== undefined) {
            await client.query(
              "DELETE FROM promo_code_courses WHERE promo_code_id = $1",
              [id]
            )

            const parsedCourseIds = Array.isArray(course_ids) && course_ids.length > 0
              ? course_ids.map(Number).filter(Boolean)
              : []

            if (parsedCourseIds.length > 0) {
              const values = parsedCourseIds
                .map((_, i) => `($1, $${i + 2})`)
                .join(", ")
              await client.query(
                `INSERT INTO promo_code_courses (promo_code_id, course_id) VALUES ${values}`,
                [id, ...parsedCourseIds]
              )
            }
          }

          await client.query("COMMIT")

          return res.status(200).json({
            message: "Promo code updated successfully",
            promoCode: updateResult.rows[0],
          })
        } catch (txError) {
          await client.query("ROLLBACK")
          throw txError
        } finally {
          client.release()
        }
      }

      case "DELETE":
        // Check if promo code exists
        const deleteCheck = await pool.query(
          "SELECT id FROM promo_codes WHERE id = $1",
          [id]
        )

        if (deleteCheck.rows.length === 0) {
          return res.status(404).json({ message: "Promo code not found" })
        }

        // Check if promo code is being used
        const usageCheck = await pool.query(
          "SELECT COUNT(*) as count FROM enrollments WHERE promo_code_id = $1",
          [id]
        )

        if (parseInt(usageCheck.rows[0].count) > 0) {
          return res.status(400).json({
            message: "Cannot delete promo code that is being used",
            usedCount: parseInt(usageCheck.rows[0].count),
          })
        }

        // Delete linked course restrictions first
        await pool.query("DELETE FROM promo_code_courses WHERE promo_code_id = $1", [id])

        // Delete promo code
        await pool.query("DELETE FROM promo_codes WHERE id = $1", [id])

        return res.status(200).json({
          message: "Promo code deleted successfully",
        })

      default:
        return res.status(405).json({ message: "Method not allowed" })
    }
  } catch (error) {
    console.error("Promo code operation error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
