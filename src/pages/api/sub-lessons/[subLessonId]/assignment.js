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

  if (req.method === "GET") return handleGet(req, res, user, subLessonId)
  if (req.method === "PUT") return handleSaveDraft(req, res, user, subLessonId)
  if (req.method === "POST") return handleSubmitQuestion(req, res, user, subLessonId)
  if (req.method === "PATCH") return handleRetryQuestion(req, res, user, subLessonId)
  return res.status(405).json({ message: "Method not allowed" })
}

async function findAssignment(queryable, subLessonId) {
  const r = await queryable.query(
    `SELECT id FROM assignments WHERE sub_lesson_id = $1`,
    [subLessonId]
  )
  return r.rows[0] || null
}

async function ensureSubmission(queryable, assignmentId, userId) {
  const existing = await queryable.query(
    `SELECT id, status, is_correct FROM assignment_submissions
     WHERE assignment_id = $1 AND user_id = $2`,
    [assignmentId, userId]
  )
  if (existing.rows[0]) return existing.rows[0]

  const inserted = await queryable.query(
    `INSERT INTO assignment_submissions (assignment_id, user_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (assignment_id, user_id) DO NOTHING
     RETURNING id, status, is_correct`,
    [assignmentId, userId]
  )
  if (inserted.rows[0]) return inserted.rows[0]

  const refetch = await queryable.query(
    `SELECT id, status, is_correct FROM assignment_submissions
     WHERE assignment_id = $1 AND user_id = $2`,
    [assignmentId, userId]
  )
  return refetch.rows[0] || null
}

async function gradeQuestion(queryable, questionId, answerText, selectedOptionIds) {
  const qRes = await queryable.query(
    `SELECT question_type, correct_text_answer FROM assignment_questions WHERE id = $1`,
    [questionId]
  )
  if (!qRes.rows.length) return null
  const q = qRes.rows[0]

  if (q.question_type === "text") {
    return {
      question_id: questionId,
      question_type: "text",
      is_correct: true,
      correct_text_answer: q.correct_text_answer,
    }
  }

  const optsRes = await queryable.query(
    `SELECT id, is_correct FROM question_options WHERE question_id = $1`,
    [questionId]
  )
  const correctIds = optsRes.rows.filter((o) => o.is_correct).map((o) => Number(o.id))
  const selectedIds = (selectedOptionIds || []).map(Number)

  let is_correct = false
  if (q.question_type === "single_choice") {
    is_correct = selectedIds.length === 1 && correctIds.includes(selectedIds[0])
  } else {
    is_correct =
      correctIds.every((cid) => selectedIds.includes(cid)) &&
      selectedIds.every((sid) => correctIds.includes(sid))
  }

  return {
    question_id: questionId,
    question_type: q.question_type,
    is_correct,
    correct_option_ids: correctIds,
    option_results: optsRes.rows.map((o) => ({
      option_id: Number(o.id),
      is_correct: !!o.is_correct,
      was_selected: selectedIds.includes(Number(o.id)),
    })),
  }
}

async function upsertAnswer(client, submissionId, questionId, answerText, selectedOptionIds) {
  await client.query(
    `DELETE FROM submission_answers WHERE submission_id = $1 AND question_id = $2`,
    [submissionId, questionId]
  )
  const ansRes = await client.query(
    `INSERT INTO submission_answers (submission_id, question_id, answer_text)
     VALUES ($1, $2, $3) RETURNING id`,
    [submissionId, questionId, answerText || null]
  )
  const answerId = ansRes.rows[0].id

  if (Array.isArray(selectedOptionIds) && selectedOptionIds.length > 0) {
    for (const optId of selectedOptionIds) {
      await client.query(
        `INSERT INTO submission_selected_options (submission_answer_id, option_id)
         VALUES ($1, $2)`,
        [answerId, Number(optId)]
      )
    }
  }
  return answerId
}

async function computeOverallStatus(client, assignmentId, submissionId) {
  const questionsRes = await client.query(
    `SELECT id, question_type FROM assignment_questions WHERE assignment_id = $1 ORDER BY id`,
    [assignmentId]
  )

  let answeredCount = 0
  const totalQuestions = questionsRes.rows.length

  for (const q of questionsRes.rows) {
    const ansRes = await client.query(
      `SELECT sa.id,
         COALESCE(json_agg(sso.option_id) FILTER (WHERE sso.option_id IS NOT NULL), '[]') as selected_option_ids
       FROM submission_answers sa
       LEFT JOIN submission_selected_options sso ON sso.submission_answer_id = sa.id
       WHERE sa.submission_id = $1 AND sa.question_id = $2
       GROUP BY sa.id`,
      [submissionId, q.id]
    )

    if (!ansRes.rows.length) return { status: "inprogress", answeredCount, totalQuestions }
    answeredCount++

    if (q.question_type === "text") continue

    const selectedIds = (ansRes.rows[0].selected_option_ids || []).map(Number)
    const optsRes = await client.query(
      `SELECT id, is_correct FROM question_options WHERE question_id = $1`,
      [q.id]
    )
    const correctIds = optsRes.rows.filter((o) => o.is_correct).map((o) => Number(o.id))

    let isCorrect
    if (q.question_type === "single_choice") {
      isCorrect = selectedIds.length === 1 && correctIds.includes(selectedIds[0])
    } else {
      isCorrect =
        correctIds.every((cid) => selectedIds.includes(cid)) &&
        selectedIds.every((sid) => correctIds.includes(sid))
    }

    if (!isCorrect) return { status: "inprogress", answeredCount, totalQuestions }
  }

  return { status: "submitted", answeredCount, totalQuestions }
}

// ─── GET: fetch assignment data for this sub-lesson ──────────────────────────

async function handleGet(req, res, user, subLessonId) {
  try {
    const assignment = await findAssignment(pool, subLessonId)
    if (!assignment) return res.status(200).json({ hasAssignment: false })

    const assignmentId = assignment.id

    const questionsRes = await pool.query(
      `SELECT id, question_text, question_type, correct_text_answer
       FROM assignment_questions WHERE assignment_id = $1 ORDER BY id ASC`,
      [assignmentId]
    )

    const questions = await Promise.all(
      questionsRes.rows.map(async (q) => {
        const optsRes = await pool.query(
          `SELECT id, option_text, is_correct
           FROM question_options WHERE question_id = $1 ORDER BY id ASC`,
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

    const submission = await ensureSubmission(pool, assignmentId, user.id)

    let existingAnswers = []
    if (submission) {
      try {
        const answersRes = await pool.query(
          `SELECT sa.id, sa.question_id, sa.answer_text,
             COALESCE(
               json_agg(sso.option_id) FILTER (WHERE sso.option_id IS NOT NULL), '[]'
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

// ─── PUT: save draft for a single question ───────────────────────────────────

async function handleSaveDraft(req, res, user, subLessonId) {
  const { question_id, answer_text, selected_option_ids } = req.body
  if (!question_id) {
    return res.status(400).json({ message: "question_id is required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const assignment = await findAssignment(client, subLessonId)
    if (!assignment) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "No assignment for this sub-lesson" })
    }

    const submission = await ensureSubmission(client, assignment.id, user.id)
    if (!submission) {
      await client.query("ROLLBACK")
      return res.status(500).json({ message: "Could not create submission" })
    }

    if (submission.status === "submitted") {
      await client.query("ROLLBACK")
      return res.status(200).json({ saved: false, reason: "already_submitted" })
    }

    await upsertAnswer(client, submission.id, question_id, answer_text, selected_option_ids)

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

// ─── POST: submit + grade a single question ─────────────────────────────────

async function handleSubmitQuestion(req, res, user, subLessonId) {
  const { question_id, answer_text, selected_option_ids } = req.body
  if (!question_id) {
    return res.status(400).json({ message: "question_id is required" })
  }

  const gradingResult = await gradeQuestion(pool, question_id, answer_text, selected_option_ids)
  if (!gradingResult) {
    return res.status(404).json({ message: "Question not found" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const assignment = await findAssignment(client, subLessonId)
    if (!assignment) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "No assignment for this sub-lesson" })
    }

    const submission = await ensureSubmission(client, assignment.id, user.id)
    if (!submission) {
      await client.query("ROLLBACK")
      return res.status(500).json({ message: "Could not create submission" })
    }

    await upsertAnswer(client, submission.id, question_id, answer_text, selected_option_ids)

    const { status: newStatus, answeredCount, totalQuestions } =
      await computeOverallStatus(client, assignment.id, submission.id)

    await client.query(
      `UPDATE assignment_submissions
       SET status = $1, is_correct = $2, updated_at = now()
       WHERE id = $3`,
      [newStatus, newStatus === "submitted", submission.id]
    )

    await client.query("COMMIT")

    return res.status(200).json({
      gradingResult,
      submissionStatus: newStatus,
      answeredCount,
      totalQuestions,
    })
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("Submit question error:", error)
    return res.status(500).json({ message: "Submit failed" })
  } finally {
    client.release()
  }
}

// ─── PATCH: retry a question (clear answer) ─────────────────────────────────

async function handleRetryQuestion(req, res, user, subLessonId) {
  const { question_id } = req.body
  if (!question_id) {
    return res.status(400).json({ message: "question_id is required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const assignment = await findAssignment(client, subLessonId)
    if (!assignment) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "No assignment for this sub-lesson" })
    }

    const upd = await client.query(
      `UPDATE assignment_submissions
       SET is_correct = NULL, status = 'inprogress', updated_at = now()
       WHERE assignment_id = $1 AND user_id = $2
       RETURNING id`,
      [assignment.id, user.id]
    )
    if (!upd.rows.length) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "Submission not found" })
    }

    await client.query(
      `DELETE FROM submission_answers
       WHERE submission_id = $1 AND question_id = $2`,
      [upd.rows[0].id, question_id]
    )

    await client.query("COMMIT")
    return res.status(200).json({ success: true })
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("Retry error:", error)
    return res.status(500).json({ message: "Retry failed" })
  } finally {
    client.release()
  }
}
