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
    return { ok: false, status: 403, message: "Admin access required" }
  }

  return { ok: true, user }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const auth = await ensureAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.message })
  }

  try {
    const {
      sub_lesson_id,
      vdo_url,
      vdo_time,
    } = req.body

    if (!sub_lesson_id || !vdo_url) {
      return res.status(400).json({
        error: "Missing required fields: sub_lesson_id, vdo_url",
      })
    }

    // Check if sub_lesson exists
    const checkResult = await pool.query(
      `SELECT id FROM sub_lessons WHERE id = $1`,
      [sub_lesson_id]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Sub-lesson not found" })
    }

    // Update sub_lesson with video info
    const result = await pool.query(
      `UPDATE sub_lessons
       SET vdo_url = $1, vdo_time = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, lesson_id, name, vdo_url, vdo_time, order_index, updated_at`,
      [vdo_url, vdo_time || null, sub_lesson_id]
    )

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: "Video saved successfully",
    })
  } catch (error) {
    console.error("Save video handler error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
