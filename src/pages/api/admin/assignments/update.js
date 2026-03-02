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

  const { assignment_id, sub_lesson_id, questions } = req.body

  if (!assignment_id) {
    return res.status(400).json({ message: "assignment_id is required" })
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "At least one question is required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Update sub_lesson_id if changed
    if (sub_lesson_id) {
      await client.query(
        `UPDATE assignments SET sub_lesson_id = $1, updated_at = now() WHERE id = $2`,
        [sub_lesson_id, assignment_id]
      )
    } else {
      await client.query(
        `UPDATE assignments SET updated_at = now() WHERE id = $1`,
        [assignment_id]
      )
    }

    // Delete all old questions (cascade deletes options too)
    await client.query(
      `DELETE FROM assignment_questions WHERE assignment_id = $1`,
      [assignment_id]
    )

    // Re-insert questions and options
    for (const q of questions) {
      const { question_text, question_type, correct_text_answer, options } = q

      if (!question_text || !question_type) continue

      const qRes = await client.query(
        `INSERT INTO assignment_questions
           (assignment_id, question_text, question_type, correct_text_answer)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          assignment_id,
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
    return res.status(200).json({ message: "Assignment updated" })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Update assignment error:", error)
    return res.status(500).json({ message: "Internal server error" })
  } finally {
    client.release()
  }
}
