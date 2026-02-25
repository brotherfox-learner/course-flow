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

  const { lesson_id, name } = req.body
  if (!lesson_id || !name?.trim()) {
    return res.status(400).json({ message: "lesson_id and name are required" })
  }

  try {
    const result = await pool.query(
      `UPDATE lessons
       SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, course_id, name, order_index, created_at, updated_at`,
      [name.trim(), lesson_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    return res.status(200).json({ lesson: result.rows[0] })
  } catch (error) {
    console.error("Update lesson error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
