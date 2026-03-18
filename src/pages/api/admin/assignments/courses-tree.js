import pool from "@/infrastructure/db"
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

  try {
    const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
      return res.status(403).json({ message: "Forbidden" })
    }
    // Single query to avoid exhausting connection pool (N+1 problem)
    const { rows } = await pool.query(`
      SELECT
        c.id AS course_id,
        c.course_name,
        l.id AS lesson_id,
        l.name AS lesson_name,
        l.order_index AS lesson_order,
        sl.id AS sub_lesson_id,
        sl.name AS sub_lesson_name,
        sl.order_index AS sub_lesson_order
      FROM courses c
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN sub_lessons sl ON sl.lesson_id = l.id
      ORDER BY c.course_name ASC, l.order_index ASC NULLS LAST, sl.order_index ASC NULLS LAST
    `)

    const courseMap = new Map()
    for (const row of rows) {
      if (!row.course_id) continue
      if (!courseMap.has(row.course_id)) {
        courseMap.set(row.course_id, { id: row.course_id, course_name: row.course_name, lessons: [] })
      }
      const course = courseMap.get(row.course_id)
      if (row.lesson_id && !course.lessons.find((l) => l.id === row.lesson_id)) {
        course.lessons.push({ id: row.lesson_id, name: row.lesson_name, sub_lessons: [] })
      }
      const lesson = course.lessons.find((l) => l.id === row.lesson_id)
      if (lesson && row.sub_lesson_id && !lesson.sub_lessons.find((s) => s.id === row.sub_lesson_id)) {
        lesson.sub_lessons.push({ id: row.sub_lesson_id, name: row.sub_lesson_name })
      }
    }
    const courses = Array.from(courseMap.values())

    return res.status(200).json({ courses })
  } catch (error) {
    console.error("List courses for assignment error:", error?.message || error)
    console.error("Full error:", error)
    return res.status(500).json({
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        debug: error?.message || String(error),
      }),
    })
  }
}
