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

  // Optional: Verify admin token here if needed
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  // Check admin role
  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  try {
    const result = await pool.query(
      `SELECT 
        c.id, 
        c.course_name as name, 
        c.price, 
        c.cover_img_url as image,
        c.created_at, 
        c.updated_at,
        COUNT(l.id)::int AS lessons
       FROM courses c
       LEFT JOIN lessons l ON l.course_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    )

    return res.status(200).json({ courses: result.rows })
  } catch (error) {
    console.error("Fetch courses error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
