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

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return { ok: false, status: 403, message: "Forbidden" }
  }

  return { ok: true }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const auth = await ensureAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message })
  }

  const { course_id, lesson_orders } = req.body
  if (!course_id || !Array.isArray(lesson_orders) || lesson_orders.length === 0) {
    return res.status(400).json({ message: "course_id and lesson_orders are required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    for (const item of lesson_orders) {
      await client.query(
        `UPDATE lessons
         SET order_index = $1, updated_at = NOW()
         WHERE id = $2 AND course_id = $3`,
        [item.order_index, item.id, course_id]
      )
    }

    await client.query("COMMIT")
    return res.status(200).json({ message: "Lesson order updated" })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Reorder lessons error:", error)
    return res.status(500).json({ message: "Internal server error" })
  } finally {
    client.release()
  }
}
