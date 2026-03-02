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

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const { sub_lesson_id, questions } = req.body

  if (!sub_lesson_id) {
    return res.status(400).json({ message: "sub_lesson_id is required" })
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "At least one question is required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Insert or get existing assignment (unique per sub_lesson_id)
    const assignmentRes = await client.query(
      `INSERT INTO assignments (sub_lesson_id)
       VALUES ($1)
       ON CONFLICT (sub_lesson_id)
       DO UPDATE SET updated_at = now()
       RETURNING id`,
      [sub_lesson_id]
    )
    const assignmentId = assignmentRes.rows[0].id

    // Delete existing questions (re-insert fresh)
    await client.query(
      `DELETE FROM assignment_questions WHERE assignment_id = $1`,
      [assignmentId]
    )

    // Insert questions and options
    for (const q of questions) {
      const { question_text, question_type, correct_text_answer, options } = q

      if (!question_text || !question_type) continue

      const qRes = await client.query(
        `INSERT INTO assignment_questions
           (assignment_id, question_text, question_type, correct_text_answer)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          assignmentId,
          question_text,
          question_type,
          question_type === "text" ? (correct_text_answer || null) : null,
        ]
      )
      const questionId = qRes.rows[0].id

      if (
        (question_type === "single_choice" || question_type === "multiple_choice") &&
        Array.isArray(options)
      ) {
        for (const opt of options) {
          if (!opt.option_text) continue
          await client.query(
            `INSERT INTO question_options (question_id, option_text, is_correct)
             VALUES ($1, $2, $3)`,
            [questionId, opt.option_text, opt.is_correct === true]
          )
        }
      }
    }

    await client.query("COMMIT")
    return res.status(201).json({ assignmentId })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Create assignment error:", error)
    return res.status(500).json({ message: "Internal server error" })
  } finally {
    client.release()
  }
}
