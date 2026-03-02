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

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const search = req.query.search || ""
  const offset = (page - 1) * limit

  try {
    const searchParam = `%${search}%`

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM assignments a
       JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
       JOIN lessons l ON l.id = sl.lesson_id
       JOIN courses c ON c.id = l.course_id
       WHERE c.course_name ILIKE $1
          OR sl.name ILIKE $1`,
      [searchParam]
    )
    const total = parseInt(countResult.rows[0].count)

    const result = await pool.query(
      `SELECT
         a.id,
         a.sub_lesson_id,
         a.created_at,
         sl.name AS sub_lesson_name,
         l.name  AS lesson_name,
         c.id    AS course_id,
         c.course_name,
         (SELECT COUNT(*) FROM assignment_questions aq WHERE aq.assignment_id = a.id)::int AS question_count,
         (SELECT aq.question_text FROM assignment_questions aq WHERE aq.assignment_id = a.id ORDER BY aq.id LIMIT 1) AS first_question
       FROM assignments a
       JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
       JOIN lessons l ON l.id = sl.lesson_id
       JOIN courses c ON c.id = l.course_id
       WHERE c.course_name ILIKE $1
          OR sl.name ILIKE $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchParam, limit, offset]
    )

    return res.status(200).json({ assignments: result.rows, total, page, limit })
  } catch (error) {
    console.error("Fetch assignments error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
