import pool from "@/infrastructure/db"
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

  const { course_id, title, file_name, file_url, file_type, file_size } = req.body

  if (!course_id || !file_url) {
    return res.status(400).json({ message: "course_id and file_url are required" })
  }

  try {
    const result = await pool.query(
      `INSERT INTO course_materials (course_id, title, file_name, file_url, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, course_id, title, file_name, file_url, file_type, file_size, created_at`,
      [
        Number(course_id),
        title || null,
        file_name || null,
        file_url,
        file_type || null,
        file_size ? Number(file_size) : null,
      ]
    )

    return res.status(201).json({ material: result.rows[0] })
  } catch (error) {
    console.error("Create course material error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
