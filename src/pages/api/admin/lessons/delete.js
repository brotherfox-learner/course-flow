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

  const { lesson_id } = req.body
  if (!lesson_id) {
    return res.status(400).json({ message: "lesson_id is required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const lessonRes = await client.query(
      `SELECT id, course_id FROM lessons WHERE id = $1`,
      [lesson_id]
    )

    if (lessonRes.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "Lesson not found" })
    }

    const courseId = lessonRes.rows[0].course_id
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1`,
      [courseId]
    )

    if (countRes.rows[0].total <= 1) {
      await client.query("ROLLBACK")
      return res.status(400).json({
        message: "A course must have at least 1 lesson",
      })
    }

    await client.query(`DELETE FROM sub_lessons WHERE lesson_id = $1`, [lesson_id])
    await client.query(`DELETE FROM lessons WHERE id = $1`, [lesson_id])

    await client.query("COMMIT")
    return res.status(200).json({ message: "Lesson deleted" })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Delete lesson error:", error)
    return res.status(500).json({ message: "Internal server error" })
  } finally {
    client.release()
  }
}
