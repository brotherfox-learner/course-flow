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

  /* ---------------- AUTH CHECK ---------------- */

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

  /* ---------------- ROLE CHECK ---------------- */

  const roleCheck = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [user.id]
  )

  if (
    roleCheck.rows.length === 0 ||
    roleCheck.rows[0].role !== "admin"
  ) {
    return res.status(403).json({ message: "Forbidden" })
  }

  /* ---------------- GET COURSE ID ---------------- */

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

      // Delete sub-lessons first (cascade through lessons)
      const deleteSubLessonsQuery = `
        DELETE FROM sub_lessons 
        WHERE lesson_id IN (
          SELECT id FROM lessons WHERE course_id = $1
        )
      `
      await pool.query(deleteSubLessonsQuery, [id])

      // Delete lessons
      const deleteLessonsQuery = `DELETE FROM lessons WHERE course_id = $1`
      await pool.query(deleteLessonsQuery, [id])

      // Delete course
      const deleteCourseQuery = `DELETE FROM courses WHERE id = $1`
      const result = await pool.query(deleteCourseQuery, [id])

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