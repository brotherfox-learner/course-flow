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

  const { id } = req.query

  try {
    // Get assignment
    const assignmentRes = await pool.query(
      `SELECT
         a.id,
         a.sub_lesson_id,
         a.created_at,
         a.updated_at,
         sl.name  AS sub_lesson_name,
         l.id     AS lesson_id,
         l.name   AS lesson_name,
         c.id     AS course_id,
         c.course_name
       FROM assignments a
       JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
       JOIN lessons l ON l.id = sl.lesson_id
       JOIN courses c ON c.id = l.course_id
       WHERE a.id = $1`,
      [id]
    )

    if (assignmentRes.rows.length === 0) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    const assignment = assignmentRes.rows[0]

    // Get questions
    const questionsRes = await pool.query(
      `SELECT id, question_text, question_type, correct_text_answer
       FROM assignment_questions
       WHERE assignment_id = $1
       ORDER BY id ASC`,
      [id]
    )

    const questions = await Promise.all(
      questionsRes.rows.map(async (q) => {
        const optionsRes = await pool.query(
          `SELECT id, option_text, is_correct
           FROM question_options
           WHERE question_id = $1
           ORDER BY id ASC`,
          [q.id]
        )
        return { ...q, options: optionsRes.rows }
      })
    )

    return res.status(200).json({ assignment: { ...assignment, questions } })
  } catch (error) {
    console.error("Fetch assignment error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
