import pool from "@/utils/db"
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
    course_id,
    course_name,
    price,
    total_learning_time,
    course_summary,
    course_detail,
    cover_img_url,
    vdo_trailer_url,
  } = req.body

  if (
    !course_id ||
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

  const parsedCourseId = Number(course_id)
  const parsedPrice = Number(price)
  const parsedLearningTime = Number(total_learning_time)

  if (!Number.isFinite(parsedCourseId) || parsedCourseId <= 0) {
    return res.status(400).json({ message: "Invalid course_id" })
  }

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Invalid price" })
  }

  if (!Number.isFinite(parsedLearningTime) || parsedLearningTime < 0) {
    return res.status(400).json({ message: "Invalid total_learning_time" })
  }

  try {
    // Check if course exists and user has permission
    const existingCourse = await pool.query(
      `SELECT id FROM courses WHERE id = $1`,
      [parsedCourseId]
    )

    if (existingCourse.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Update course
    const result = await pool.query(
      `UPDATE courses SET 
        course_name = $1,
        price = $2,
        total_learning_time = $3,
        course_summary = $4,
        course_detail = $5,
        cover_img_url = $6,
        vdo_trailer_url = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, course_name, price, total_learning_time, course_summary, course_detail, cover_img_url, vdo_trailer_url`,
      [
        course_name.trim(),
        parsedPrice,
        parsedLearningTime,
        course_summary.trim(),
        course_detail.trim(),
        cover_img_url.trim(),
        vdo_trailer_url.trim(),
        parsedCourseId
      ]
    )

    return res.status(200).json({ 
      message: "Course updated successfully", 
      course: result.rows[0] 
    })
  } catch (error) {
    console.error("Update course error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
