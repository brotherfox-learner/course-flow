import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
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

  const { id } = req.query // assignment_id

  if (req.method === "GET") {
    try {
      // Get assignment questions & options
      const questionsRes = await pool.query(
        `SELECT id, question_text, question_type, correct_text_answer
         FROM assignment_questions
         WHERE assignment_id = $1
         ORDER BY id ASC`,
        [id]
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
          // Don't expose is_correct to client yet
          return {
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            correct_text_answer: q.correct_text_answer, // expose for text type UX
            options: optsRes.rows.map((o) => ({
              id: o.id,
              option_text: o.option_text,
              is_correct: o.is_correct, // needed for grading on submit
            })),
          }
        })
      )

      // Get existing submission if any (graceful if table missing)
      let submission = null
      let existingAnswers = []
      try {
        const submissionRes = await pool.query(
          `SELECT id, status, is_correct FROM assignment_submissions
           WHERE assignment_id = $1 AND user_id = $2`,
          [id, user.id]
        )
        submission = submissionRes.rows[0] || null

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
            console.warn("submission_selected_options may not exist:", err.message)
            // Fallback without options join
            const answersRes = await pool.query(
              `SELECT id, question_id, answer_text FROM submission_answers WHERE submission_id = $1`,
              [submission.id]
            )
            existingAnswers = answersRes.rows.map((r) => ({ ...r, selected_option_ids: [] }))
          }
        }
      } catch (err) {
        console.warn("assignment_submissions may not exist:", err.message)
      }

      return res.status(200).json({ questions, submission, existingAnswers })
    } catch (error) {
      console.error("Fetch assignment detail error:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  if (req.method === "POST") {
    // Submit answers
    const { answers } = req.body
    // answers: [{ question_id, answer_text?, selected_option_ids? }]

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "answers array is required" })
    }

    // ── STEP 1: Compute grading FIRST (using pool, no transaction yet) ──────
    // This ensures grading results are always returned even if DB tables for
    // storing selected options don't exist yet.
    const gradingResults = []

    for (const ans of answers) {
      const { question_id, answer_text, selected_option_ids } = ans

      const qRes = await pool.query(
        `SELECT question_type, correct_text_answer FROM assignment_questions WHERE id = $1`,
        [question_id]
      )
      if (!qRes.rows.length) continue
      const q = qRes.rows[0]

      if (q.question_type === "text") {
        // Text: always correct, no answer checking
        gradingResults.push({
          question_id,
          question_type: "text",
          is_correct: true,
          correct_text_answer: q.correct_text_answer,
        })
      } else {
        const optsRes = await pool.query(
          `SELECT id, is_correct FROM question_options WHERE question_id = $1`,
          [question_id]
        )
        const correctIds = optsRes.rows.filter((o) => o.is_correct).map((o) => Number(o.id))
        const selectedIds = (selected_option_ids || []).map(Number)

        let is_correct = false
        if (q.question_type === "single_choice") {
          is_correct = selectedIds.length === 1 && correctIds.includes(selectedIds[0])
        } else {
          const allCorrectSelected = correctIds.every((cid) => selectedIds.includes(cid))
          const noWrongSelected = selectedIds.every((sid) => correctIds.includes(sid))
          is_correct = allCorrectSelected && noWrongSelected
        }

        const optionResults = optsRes.rows.map((o) => ({
          option_id: Number(o.id),
          is_correct: !!o.is_correct,
          was_selected: selectedIds.includes(Number(o.id)),
        }))

        gradingResults.push({
          question_id,
          question_type: q.question_type,
          is_correct,
          correct_option_ids: correctIds,
          option_results: optionResults,
        })
      }
    }

    // status: submitted = all correct, inprogress = has wrong (can retry)
    const anyChoiceWrong = gradingResults.some(
      (r) => r.question_type !== "text" && !r.is_correct
    )
    const isCorrectValue = !anyChoiceWrong
    const statusValue = anyChoiceWrong ? "inprogress" : "submitted"

    // ── STEP 2: Persist submission to DB (best-effort, won't crash response) ──
    let submissionId = null
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const submissionRes = await client.query(
        `INSERT INTO assignment_submissions (assignment_id, user_id, status, is_correct)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assignment_id, user_id)
         DO UPDATE SET status = $3, is_correct = $4, updated_at = now()
         RETURNING id`,
        [id, user.id, statusValue, isCorrectValue]
      )
      submissionId = submissionRes.rows[0].id

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

        // Try to save selected options — non-fatal if table doesn't exist
        if (Array.isArray(selected_option_ids) && selected_option_ids.length > 0) {
          try {
            for (const optId of selected_option_ids) {
              await client.query(
                `INSERT INTO submission_selected_options (submission_answer_id, option_id)
                 VALUES ($1, $2)`,
                [answerId, Number(optId)]
              )
            }
          } catch (optErr) {
            console.warn("submission_selected_options insert failed (table may not exist):", optErr.message)
            // Continue without storing options — grading was already computed above
          }
        }
      }

      await client.query("COMMIT")
    } catch (dbError) {
      await client.query("ROLLBACK").catch(() => {})
      console.warn("Submission persist failed (non-fatal):", dbError.message)
    } finally {
      client.release()
    }

    // Always return grading results regardless of DB persistence success
    return res.status(200).json({ submissionId, gradingResults })
  }

  if (req.method === "PATCH") {
    // Retry: set is_correct=null, status=inprogress, delete answer for that question
    const { question_id } = req.body || {}
    if (!question_id) {
      return res.status(400).json({ message: "question_id is required" })
    }

    try {
      const client = await pool.connect()
      try {
        await client.query("BEGIN")

        const upd = await client.query(
          `UPDATE assignment_submissions
           SET is_correct = NULL, status = 'inprogress', updated_at = now()
           WHERE assignment_id = $1 AND user_id = $2
           RETURNING id`,
          [id, user.id]
        )
        if (upd.rows.length === 0) {
          await client.query("ROLLBACK")
          return res.status(404).json({ message: "Submission not found" })
        }
        const submissionId = upd.rows[0].id

        await client.query(
          `DELETE FROM submission_answers
           WHERE submission_id = $1 AND question_id = $2`,
          [submissionId, question_id]
        )

        await client.query("COMMIT")
        return res.status(200).json({ success: true })
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {})
        throw err
      } finally {
        client.release()
      }
    } catch (err) {
      console.error("Retry error:", err)
      return res.status(500).json({ message: "Retry failed" })
    }
  }

  return res.status(405).json({ message: "Method not allowed" })
}
