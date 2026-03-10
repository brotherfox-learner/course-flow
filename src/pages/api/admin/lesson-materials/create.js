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
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const { lesson_id, file_name, file_url, file_type } = req.body

  if (!lesson_id || !file_url) {
    return res.status(400).json({ message: "lesson_id and file_url are required" })
  }

  try {
    const result = await pool.query(
      `INSERT INTO lesson_materials (lesson_id, file_name, file_url, file_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, lesson_id, file_name, file_url, file_type, created_at`,
      [lesson_id, file_name || null, file_url, file_type || null]
    )

    return res.status(201).json({ material: result.rows[0] })
  } catch (error) {
    console.error("Create lesson material error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
