import pool from "@/infrastructure/db"
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
  const search = (req.query.search || "").trim()
  const offset = (page - 1) * limit

  try {
    const hasSearch = search.length > 0
    const searchParam = hasSearch ? `%${search}%` : null

    const countQuery = hasSearch
      ? `SELECT COUNT(DISTINCT a.id) FROM assignments a
         JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
         JOIN lessons l ON l.id = sl.lesson_id
         JOIN courses c ON c.id = l.course_id
         LEFT JOIN assignment_questions aq ON aq.assignment_id = a.id
         WHERE c.course_name ILIKE $1
            OR l.name ILIKE $1
            OR sl.name ILIKE $1
            OR aq.question_text ILIKE $1`
      : `SELECT COUNT(*) FROM assignments a
         JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
         JOIN lessons l ON l.id = sl.lesson_id
         JOIN courses c ON c.id = l.course_id`

    const countResult = await pool.query(countQuery, hasSearch ? [searchParam] : [])
    const total = parseInt(countResult.rows[0].count)

    const listQuery = hasSearch
      ? `SELECT
           a.id,
           a.sub_lesson_id,
           a.created_at,
           sl.name AS sub_lesson_name,
           l.name  AS lesson_name,
           c.id    AS course_id,
           c.course_name,
           (SELECT COUNT(*) FROM assignment_questions aq2 WHERE aq2.assignment_id = a.id)::int AS question_count,
           (SELECT aq2.question_text FROM assignment_questions aq2 WHERE aq2.assignment_id = a.id ORDER BY aq2.id LIMIT 1) AS first_question
         FROM assignments a
         JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
         JOIN lessons l ON l.id = sl.lesson_id
         JOIN courses c ON c.id = l.course_id
         WHERE c.course_name ILIKE $1
            OR l.name ILIKE $1
            OR sl.name ILIKE $1
            OR EXISTS (
              SELECT 1 FROM assignment_questions aq3
              WHERE aq3.assignment_id = a.id AND aq3.question_text ILIKE $1
            )
         ORDER BY a.created_at DESC
         LIMIT $2 OFFSET $3`
      : `SELECT
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
         ORDER BY a.created_at DESC
         LIMIT $1 OFFSET $2`

    const result = await pool.query(
      hasSearch ? listQuery : listQuery,
      hasSearch ? [searchParam, limit, offset] : [limit, offset]
    )

    return res.status(200).json({ assignments: result.rows, total, page, limit })
  } catch (error) {
    console.error("Fetch assignments error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
