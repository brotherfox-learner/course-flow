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

  // Verify admin token
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
    // Get pagination and filter parameters
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      lesson_id = null 
    } = req.query
    
    const offset = (page - 1) * limit
    const parsedLimit = Math.min(parseInt(limit), 100) // Max 100 items per page
    const parsedPage = Math.max(parseInt(page), 1)

    // Build WHERE clause
    let whereClause = ""
    let queryParams = []
    let paramIndex = 1

    if (lesson_id) {
      whereClause = `WHERE sl.lesson_id = $${paramIndex} `
      queryParams.push(lesson_id)
      paramIndex++
    }

    if (search && search.trim()) {
      if (whereClause) {
        whereClause += `AND sl.sublesson_title ILIKE $${paramIndex} `
      } else {
        whereClause = `WHERE sl.sublesson_title ILIKE $${paramIndex} `
      }
      queryParams.push(`%${search.trim()}%`)
      paramIndex++
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sublessons sl
      ${whereClause}
    `
    
    const countResult = await pool.query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get paginated sublessons with lesson and course info
    const sublessonsQuery = `
      SELECT 
        sl.id,
        sl.sublesson_title as title,
        sl.sublesson_description as description,
        sl.video_url,
        sl.video_cloudinary_id,
        sl.video_duration,
        sl.sublesson_order,
        sl.created_at,
        sl.updated_at,
        sl.lesson_id,
        l.lesson_title as lesson_title,
        l.course_id,
        c.course_name as course_name
      FROM sublessons sl
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      LEFT JOIN courses c ON l.course_id = c.id
      ${whereClause}
      ORDER BY sl.lesson_id, sl.sublesson_order ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(parsedLimit, offset)
    const result = await pool.query(sublessonsQuery)

    return res.status(200).json({ 
      subLessons: result.rows,
      total: total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    })
  } catch (error) {
    console.error("Fetch sublessons error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
