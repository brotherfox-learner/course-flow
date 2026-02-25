import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [
    user.id,
  ])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const { lesson_id, name, order_index, vdo_url, vdo_time } = req.body

  if (!lesson_id || !name) {
    return res
      .status(400)
      .json({ message: "lesson_id and name are required" })
  }

  try {
    let nextOrderIndex = Number(order_index)

    if (!Number.isFinite(nextOrderIndex)) {
      const orderRes = await pool.query(
        `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_index
         FROM sub_lessons
         WHERE lesson_id = $1`,
        [lesson_id]
      )
      nextOrderIndex = orderRes.rows[0]?.next_index ?? 1
    }

    const result = await pool.query(
      `INSERT INTO sub_lessons (lesson_id, name, order_index, vdo_url, vdo_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, lesson_id, name, order_index, vdo_url, vdo_time, created_at, updated_at`,
      [lesson_id, name, nextOrderIndex, vdo_url ?? null, vdo_time ?? null]
    )

    return res.status(201).json({ subLesson: result.rows[0] })
  } catch (error) {
    console.error("Create sub-lesson error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
