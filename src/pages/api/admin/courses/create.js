import pool from "@/infrastructure/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

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

  const {
    course_name,
    price,
    total_learning_time,
    course_summary,
    course_detail,
    cover_img_url,
    vdo_trailer_url,
    published = false
  } = req.body

  if (
    !course_name?.trim() ||
    price == null ||
    total_learning_time == null ||
    !course_summary?.trim() ||
    !course_detail?.trim() ||
    !cover_img_url?.trim() ||
    !vdo_trailer_url?.trim()
  ) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  const parsedPrice = Number(price)
  const parsedLearningTime = Number(total_learning_time)

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Invalid price" })
  }

  if (!Number.isFinite(parsedLearningTime) || parsedLearningTime < 0) {
    return res.status(400).json({ message: "Invalid total_learning_time" })
  }

  // Generate slug from course name
  const slug = course_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  try {
    const result = await pool.query(
      `INSERT INTO courses (
        course_name, 
        price, 
        total_learning_time, 
        course_summary, 
        course_detail, 
        cover_img_url, 
        vdo_trailer_url,
        slug,
        published,
        instructor_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        course_name.trim(), 
        parsedPrice, 
        parsedLearningTime, 
        course_summary.trim(), 
        course_detail.trim(), 
        cover_img_url.trim(), 
        vdo_trailer_url.trim(),
        slug,
        published,
        user.id
      ]
    )

    return res.status(201).json({ message: "Course created successfully", courseId: result.rows[0].id })
  } catch (error) {
    console.error("Create course error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
