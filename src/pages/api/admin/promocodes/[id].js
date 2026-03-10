import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getAdminUser(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.split(" ")[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") return null
  return user
}

export default async function handler(req, res) {
  const { id } = req.query

  const user = await getAdminUser(req)
  if (!user) return res.status(401).json({ message: "Unauthorized" })

  if (req.method === "GET") {
    try {
      const result = await pool.query(
        `SELECT
          p.id, p.code, p.name, p.discount_type, p.discount_value,
          p.min_price, p.max_uses, p.valid_from, p.valid_until, p.created_at,
          CASE
            WHEN p.valid_until IS NOT NULL AND p.valid_until < NOW() THEN 'expired'
            WHEN p.valid_from IS NOT NULL AND p.valid_from > NOW() THEN 'inactive'
            ELSE 'active'
          END AS status,
          (SELECT COUNT(*)::int FROM promo_code_usages u WHERE u.promo_code_id = p.id) AS used_count,
          COALESCE(
            (SELECT json_agg(pc.course_id) FROM promo_code_courses pc WHERE pc.promo_code_id = p.id),
            '[]'::json
          ) AS course_ids
        FROM promo_codes p
        WHERE p.id = $1`,
        [id]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Promo code not found" })
      }
      return res.status(200).json({ promoCode: result.rows[0] })
    } catch (error) {
      console.error("Fetch promo code error:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  if (req.method === "PUT") {
    const {
      code, name, discount_type, discount_value,
      min_price, max_uses, valid_from, valid_until,
      course_ids,
    } = req.body

    if (!code || !discount_type || discount_value == null) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const result = await client.query(
        `UPDATE promo_codes SET
          code = $1, name = $2, discount_type = $3, discount_value = $4,
          min_price = $5, max_uses = $6, valid_from = $7, valid_until = $8
        WHERE id = $9
        RETURNING id`,
        [
          code.toUpperCase(),
          name || null,
          discount_type,
          Number(discount_value),
          min_price ? Number(min_price) : 0,
          max_uses ? Number(max_uses) : null,
          valid_from || null,
          valid_until || null,
          id,
        ]
      )

      if (result.rows.length === 0) {
        await client.query("ROLLBACK")
        return res.status(404).json({ message: "Promo code not found" })
      }

      await client.query(`DELETE FROM promo_code_courses WHERE promo_code_id = $1`, [id])

      if (Array.isArray(course_ids) && course_ids.length > 0) {
        for (const courseId of course_ids) {
          await client.query(
            `INSERT INTO promo_code_courses (promo_code_id, course_id) VALUES ($1, $2)`,
            [id, courseId]
          )
        }
      }

      await client.query("COMMIT")
      return res.status(200).json({ message: "Promo code updated" })
    } catch (error) {
      await client.query("ROLLBACK")
      if (error.code === "23505") {
        return res.status(409).json({ message: "Promo code already exists" })
      }
      console.error("Update promo code error:", error)
      return res.status(500).json({ message: "Internal server error" })
    } finally {
      client.release()
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await pool.query(
        `DELETE FROM promo_codes WHERE id = $1 RETURNING id`,
        [id]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Promo code not found" })
      }
      return res.status(200).json({ message: "Promo code deleted" })
    } catch (error) {
      console.error("Delete promo code error:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  return res.status(405).json({ message: "Method not allowed" })
}
