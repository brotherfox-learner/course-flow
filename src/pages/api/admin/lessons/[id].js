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

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [
    user.id,
  ])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const { id } = req.query

  try {
    const result = await pool.query(
      `
      SELECT 
        l.id,
        l.name,
        l.order_index,
        json_agg(
          json_build_object(
            'id', sl.id,
            'name', sl.name,
            'order_index', sl.order_index,
            'vdo_url', sl.vdo_url,
            'vdo_time', sl.vdo_time
          )
        ) FILTER (WHERE sl.id IS NOT NULL) as sub_lessons
      FROM lessons l
      LEFT JOIN sub_lessons sl ON l.id = sl.lesson_id
      WHERE l.course_id = $1
      GROUP BY l.id, l.name, l.order_index
      ORDER BY l.order_index ASC
    `,
      [id]
    )

    const lessons = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      order_index: row.order_index,
      sub_lessons: row.sub_lessons || [],
    }))

    return res.status(200).json({ lessons })
  } catch (error) {
    console.error("Fetch admin lessons error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
