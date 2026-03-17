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
      course_id = null 
    } = req.query
    
    const parsedLimit = Math.min(parseInt(limit) || 10, 100) // Max 100 items per page
    const parsedPage = Math.max(parseInt(page) || 1, 1)
    const offset = (parsedPage - 1) * parsedLimit

    // Build WHERE clause
    let whereClause = ""
    let queryParams = []
    let paramIndex = 1

    if (course_id) {
      whereClause = `WHERE l.course_id = $${paramIndex} `
      queryParams.push(course_id)
      paramIndex++
    }

    if (search && search.trim()) {
      if (whereClause) {
        whereClause += `AND l.name ILIKE $${paramIndex} `
      } else {
        whereClause = `WHERE l.name ILIKE $${paramIndex} `
      }
      queryParams.push(`%${search.trim()}%`)
      paramIndex++
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lessons l
      ${whereClause}
    `
    
    const countResult = await pool.query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get paginated lessons with course info
    const lessonsQuery = `
      SELECT 
        l.id,
        l.name,
        l.order_index,
        l.created_at,
        l.updated_at,
        l.course_id,
        c.course_name as course_name,
        COUNT(sl.id)::int AS sublessons
      FROM lessons l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN sub_lessons sl ON sl.lesson_id = l.id
      ${whereClause}
      GROUP BY l.id, c.course_name
      ORDER BY l.course_id, l.order_index ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(parsedLimit, offset)
    const result = await pool.query(lessonsQuery, queryParams)

    return res.status(200).json({ 
      lessons: result.rows,
      total: total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    })
  } catch (error) {
    console.error("Fetch lessons error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
