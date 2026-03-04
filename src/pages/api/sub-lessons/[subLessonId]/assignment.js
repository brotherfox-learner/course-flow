import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function authenticate(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.split(" ")[1]
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  return error || !user ? null : user
}

export default async function handler(req, res) {
  const user = await authenticate(req)
  if (!user) return res.status(401).json({ message: "Unauthorized" })

  const { subLessonId } = req.query

  if (req.method === "GET") {
    return handleGet(req, res, user, subLessonId)
  }
  if (req.method === "PUT") {
    return handleSaveDraft(req, res, user, subLessonId)
  }
  return res.status(405).json({ message: "Method not allowed" })
}

async function handleGet(req, res, user, subLessonId) {
  try {
    const assignmentRes = await pool.query(
      `SELECT id FROM assignments WHERE sub_lesson_id = $1`,
      [subLessonId]
    )
    if (assignmentRes.rows.length === 0) {
      return res.status(200).json({ hasAssignment: false })
    }

    const assignmentId = assignmentRes.rows[0].id

    const questionsRes = await pool.query(
      `SELECT id, question_text, question_type, correct_text_answer
       FROM assignment_questions
       WHERE assignment_id = $1
       ORDER BY id ASC`,
      [assignmentId]
    )

    const questions = await Promise.all(
      questionsRes.rows.map(async (q) => {
        const optsRes = await pool.query(
          `SELECT id, option_text, is_correct
           FROM question_options
           WHERE question_id = $1
           ORDER BY id ASC`,
          [q.id]
        )
        return {
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          correct_text_answer: q.correct_text_answer,
          options: optsRes.rows.map((o) => ({
            id: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
          })),
        }
      })
    )

    let submission = null
    let existingAnswers = []

    const submissionRes = await pool.query(
      `SELECT id, status, is_correct FROM assignment_submissions
       WHERE assignment_id = $1 AND user_id = $2`,
      [assignmentId, user.id]
    )
    submission = submissionRes.rows[0] || null

    if (!submission) {
      const insertRes = await pool.query(
        `INSERT INTO assignment_submissions (assignment_id, user_id, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (assignment_id, user_id) DO NOTHING
         RETURNING id, status, is_correct`,
        [assignmentId, user.id]
      )
      submission = insertRes.rows[0] || null

      if (!submission) {
        const refetch = await pool.query(
          `SELECT id, status, is_correct FROM assignment_submissions
           WHERE assignment_id = $1 AND user_id = $2`,
          [assignmentId, user.id]
        )
        submission = refetch.rows[0] || null
      }
    }

    if (submission) {
      try {
        const answersRes = await pool.query(
          `SELECT
             sa.id,
             sa.question_id,
             sa.answer_text,
             COALESCE(
               json_agg(sso.option_id) FILTER (WHERE sso.option_id IS NOT NULL),
               '[]'
             ) AS selected_option_ids
           FROM submission_answers sa
           LEFT JOIN submission_selected_options sso ON sso.submission_answer_id = sa.id
           WHERE sa.submission_id = $1
           GROUP BY sa.id, sa.question_id, sa.answer_text`,
          [submission.id]
        )
        existingAnswers = answersRes.rows
      } catch (err) {
        console.warn("Failed to load existing answers:", err.message)
        const answersRes = await pool.query(
          `SELECT id, question_id, answer_text FROM submission_answers WHERE submission_id = $1`,
          [submission.id]
        )
        existingAnswers = answersRes.rows.map((r) => ({
          ...r,
          selected_option_ids: [],
        }))
      }
    }

    return res.status(200).json({
      hasAssignment: true,
      assignmentId,
      questions,
      submission,
      existingAnswers,
    })
  } catch (error) {
    console.error("Fetch sub-lesson assignment error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

async function handleSaveDraft(req, res, user, subLessonId) {
  const { answers } = req.body
  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: "answers array is required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const assignmentRes = await client.query(
      `SELECT id FROM assignments WHERE sub_lesson_id = $1`,
      [subLessonId]
    )
    if (assignmentRes.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "No assignment for this sub-lesson" })
    }
    const assignmentId = assignmentRes.rows[0].id

    const submissionRes = await client.query(
      `INSERT INTO assignment_submissions (assignment_id, user_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (assignment_id, user_id)
       DO UPDATE SET updated_at = now()
       RETURNING id, status`,
      [assignmentId, user.id]
    )
    const submissionId = submissionRes.rows[0].id
    const currentStatus = submissionRes.rows[0].status

    if (currentStatus === "submitted") {
      await client.query("ROLLBACK")
      return res.status(200).json({ saved: false, reason: "already_submitted" })
    }

    await client.query(
      `DELETE FROM submission_answers WHERE submission_id = $1`,
      [submissionId]
    )

    for (const ans of answers) {
      const { question_id, answer_text, selected_option_ids } = ans

      const ansRes = await client.query(
        `INSERT INTO submission_answers (submission_id, question_id, answer_text)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [submissionId, question_id, answer_text || null]
      )
      const answerId = ansRes.rows[0].id

      if (Array.isArray(selected_option_ids) && selected_option_ids.length > 0) {
        for (const optId of selected_option_ids) {
          await client.query(
            `INSERT INTO submission_selected_options (submission_answer_id, option_id)
             VALUES ($1, $2)`,
            [answerId, Number(optId)]
          )
        }
      }
    }

    await client.query("COMMIT")
    return res.status(200).json({ saved: true })
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("Save draft error:", error)
    return res.status(500).json({ message: "Failed to save draft" })
  } finally {
    client.release()
  }
}
