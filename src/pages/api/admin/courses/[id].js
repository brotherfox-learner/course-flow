import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "DELETE") {
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

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [
    user.id,
  ])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const { id } = req.query

  if (req.method === "GET") {
    try {
      const result = await pool.query(
        `SELECT * FROM courses WHERE id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Course not found" })
      }

      return res.status(200).json({ course: result.rows[0] })
    } catch (error) {
      console.error("Fetch admin course error:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  if (req.method === "DELETE") {
    try {
      // Start transaction
      await pool.query('BEGIN')

      // Delete submission_selected_options → submission_answers → assignment_submissions → assignment_questions → assignments
      // (all linked through sub_lessons → assignments)
      await pool.query(
        `DELETE FROM submission_selected_options WHERE submission_answer_id IN (
          SELECT sa.id FROM submission_answers sa
          JOIN assignment_submissions asub ON sa.submission_id = asub.id
          JOIN assignments a ON asub.assignment_id = a.id
          JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
          JOIN lessons l ON sl.lesson_id = l.id
          WHERE l.course_id = $1
        )`, [id]
      )
      await pool.query(
        `DELETE FROM submission_answers WHERE submission_id IN (
          SELECT asub.id FROM assignment_submissions asub
          JOIN assignments a ON asub.assignment_id = a.id
          JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
          JOIN lessons l ON sl.lesson_id = l.id
          WHERE l.course_id = $1
        )`, [id]
      )
      await pool.query(
        `DELETE FROM assignment_submissions WHERE assignment_id IN (
          SELECT a.id FROM assignments a
          JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
          JOIN lessons l ON sl.lesson_id = l.id
          WHERE l.course_id = $1
        )`, [id]
      )
      await pool.query(
        `DELETE FROM question_options WHERE question_id IN (
          SELECT aq.id FROM assignment_questions aq
          JOIN assignments a ON aq.assignment_id = a.id
          JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
          JOIN lessons l ON sl.lesson_id = l.id
          WHERE l.course_id = $1
        )`, [id]
      )
      await pool.query(
        `DELETE FROM assignment_questions WHERE assignment_id IN (
          SELECT a.id FROM assignments a
          JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
          JOIN lessons l ON sl.lesson_id = l.id
          WHERE l.course_id = $1
        )`, [id]
      )
      await pool.query(
        `DELETE FROM assignments WHERE sub_lesson_id IN (
          SELECT sl.id FROM sub_lessons sl
          JOIN lessons l ON sl.lesson_id = l.id
          WHERE l.course_id = $1
        )`, [id]
      )

      // Delete sub_lesson_progress
      await pool.query(
        `DELETE FROM sub_lesson_progress WHERE sub_lesson_id IN (
          SELECT sl.id FROM sub_lessons sl
          JOIN lessons l ON sl.lesson_id = l.id
          WHERE l.course_id = $1
        )`, [id]
      )

      // Delete sub-lessons
      await pool.query(
        `DELETE FROM sub_lessons WHERE lesson_id IN (
          SELECT id FROM lessons WHERE course_id = $1
        )`, [id]
      )

      // Delete lesson_materials
      await pool.query(
        `DELETE FROM lesson_materials WHERE lesson_id IN (
          SELECT id FROM lessons WHERE course_id = $1
        )`, [id]
      )

      // Delete lessons
      await pool.query(`DELETE FROM lessons WHERE course_id = $1`, [id])

      // Delete course_materials
      await pool.query(`DELETE FROM course_materials WHERE course_id = $1`, [id])

      // Delete promo_code_courses
      await pool.query(`DELETE FROM promo_code_courses WHERE course_id = $1`, [id])

      // Delete payments (must come before enrollments due to FK)
      await pool.query(`DELETE FROM payments WHERE course_id = $1`, [id])

      // Delete promo_code_usages linked to enrollments of this course
      await pool.query(
        `DELETE FROM promo_code_usages WHERE enrollment_id IN (
          SELECT id FROM enrollments WHERE course_id = $1
        )`, [id]
      )

      // Delete enrollments
      await pool.query(`DELETE FROM enrollments WHERE course_id = $1`, [id])

      // Delete course
      const result = await pool.query(`DELETE FROM courses WHERE id = $1`, [id])

      if (result.rowCount === 0) {
        await pool.query('ROLLBACK')
        return res.status(404).json({ message: "Course not found" })
      }

      // Commit transaction
      await pool.query('COMMIT')

      return res.status(200).json({ 
        success: true, 
        message: "Course deleted successfully" 
      })
    } catch (error) {
      console.error("Delete course error:", error)
      await pool.query('ROLLBACK')
      return res.status(500).json({ 
        message: "Failed to delete course",
        error: error.message 
      })
    }
  }
}
