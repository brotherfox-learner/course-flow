import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { courseId } = req.query
  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" })
  }

  /* ---------------- AUTH CHECK ---------------- */

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  /* ---------------- ENROLLMENT CHECK ---------------- */

  try {
    const enrollCheck = await pool.query(
      `SELECT id FROM enrollments
       WHERE user_id = $1 AND course_id = $2::bigint AND status IN ('active', 'completed')`,
      [user.id, courseId]
    )

    if (enrollCheck.rows.length === 0) {
      return res.status(403).json({ message: "You must be enrolled in this course to access materials" })
    }

    /* ---------------- FETCH MATERIALS ---------------- */

    const result = await pool.query(
      `SELECT id, course_id, title, file_name, file_url, file_type, file_size, created_at
       FROM course_materials
       WHERE course_id = $1::bigint
       ORDER BY created_at ASC`,
      [courseId]
    )

    return res.status(200).json({ materials: result.rows })
  } catch (error) {
    console.error("Fetch course materials error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
