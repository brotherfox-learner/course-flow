import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/*
ตรวจสอบ admin
*/
async function ensureAdmin(req) {

  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" }
  }

  const token = authHeader.split(" ")[1]

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { ok: false, status: 401, message: "Invalid token" }
  }

  const roleCheck = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [user.id]
  )

  if (
    roleCheck.rows.length === 0 ||
    roleCheck.rows[0].role !== "admin"
  ) {
    return { ok: false, status: 403, message: "Forbidden" }
  }

  return { ok: true }
}

export default async function handler(req, res) {

  if (req.method !== "DELETE") {
    return res.status(405).json({
      message: "Method not allowed"
    })
  }

  const auth = await ensureAdmin(req)

  if (!auth.ok) {
    return res.status(auth.status).json({
      message: auth.message
    })
  }

  const { lesson_id } = req.body

  if (!lesson_id) {
    return res.status(400).json({
      message: "lesson_id is required"
    })
  }

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /*
    หา lesson
    */

    const lessonRes = await client.query(
      `SELECT id, course_id, order_index
       FROM lessons
       WHERE id = $1`,
      [lesson_id]
    )

    if (lessonRes.rows.length === 0) {

      await client.query("ROLLBACK")

      return res.status(404).json({
        message: "Lesson not found"
      })

    }

    const { course_id, order_index } = lessonRes.rows[0]

    /*
    เช็คว่า course มี lesson อย่างน้อย 1
    */

    const countRes = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM lessons
       WHERE course_id = $1`,
      [course_id]
    )

    if (countRes.rows[0].total <= 1) {

      await client.query("ROLLBACK")

      return res.status(400).json({
        message: "A course must have at least 1 lesson"
      })

    }

    // Delete assignment chain for sub_lessons under this lesson
    await client.query(
      `DELETE FROM submission_selected_options WHERE submission_answer_id IN (
        SELECT sa.id FROM submission_answers sa
        JOIN assignment_submissions asub ON sa.submission_id = asub.id
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        WHERE sl.lesson_id = $1
      )`, [lesson_id]
    )
    await client.query(
      `DELETE FROM submission_answers WHERE submission_id IN (
        SELECT asub.id FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        WHERE sl.lesson_id = $1
      )`, [lesson_id]
    )
    await client.query(
      `DELETE FROM assignment_submissions WHERE assignment_id IN (
        SELECT a.id FROM assignments a
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        WHERE sl.lesson_id = $1
      )`, [lesson_id]
    )
    await client.query(
      `DELETE FROM question_options WHERE question_id IN (
        SELECT aq.id FROM assignment_questions aq
        JOIN assignments a ON aq.assignment_id = a.id
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        WHERE sl.lesson_id = $1
      )`, [lesson_id]
    )
    await client.query(
      `DELETE FROM assignment_questions WHERE assignment_id IN (
        SELECT a.id FROM assignments a
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        WHERE sl.lesson_id = $1
      )`, [lesson_id]
    )
    await client.query(
      `DELETE FROM assignments WHERE sub_lesson_id IN (
        SELECT id FROM sub_lessons WHERE lesson_id = $1
      )`, [lesson_id]
    )

    // Delete sub_lesson_progress
    await client.query(
      `DELETE FROM sub_lesson_progress WHERE sub_lesson_id IN (
        SELECT id FROM sub_lessons WHERE lesson_id = $1
      )`, [lesson_id]
    )

    // Delete sub_lessons
    await client.query(`DELETE FROM sub_lessons WHERE lesson_id = $1`, [lesson_id])

    // Delete lesson_materials
    await client.query(`DELETE FROM lesson_materials WHERE lesson_id = $1`, [lesson_id])

    // Delete lesson
    await client.query(`DELETE FROM lessons WHERE id = $1`, [lesson_id])

    await client.query("COMMIT")

    return res.status(200).json({
      message: "Lesson deleted"
    })

  } catch (err) {

    await client.query("ROLLBACK")

    console.error("Delete lesson error:", err)

    return res.status(500).json({
      message: "Internal server error"
    })

  } finally {

    client.release()

  }

}