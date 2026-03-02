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

  try {
    // Return all courses with their lessons and sub-lessons for the cascaded dropdown
    const coursesRes = await pool.query(
      `SELECT id, course_name FROM courses ORDER BY course_name ASC`
    )

    const courses = await Promise.all(
      coursesRes.rows.map(async (course) => {
        const lessonsRes = await pool.query(
          `SELECT id, name FROM lessons WHERE course_id = $1 ORDER BY order_index ASC`,
          [course.id]
        )

        const lessons = await Promise.all(
          lessonsRes.rows.map(async (lesson) => {
            const subLessonsRes = await pool.query(
              `SELECT id, name FROM sub_lessons WHERE lesson_id = $1 ORDER BY order_index ASC`,
              [lesson.id]
            )
            return { ...lesson, sub_lessons: subLessonsRes.rows }
          })
        )

        return { ...course, lessons }
      })
    )

    return res.status(200).json({ courses })
  } catch (error) {
    console.error("List courses for assignment error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
