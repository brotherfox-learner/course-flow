import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {

  /* ---------------- METHOD CHECK ---------------- */

  if (req.method !== "GET") {
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

  try {

    /* ---------------- MAIN QUERY ---------------- */

    const result = await pool.query(

      `
      SELECT
        c.id,
        c.course_name,
        c.slug,
        c.course_summary,
        c.course_detail,
        c.price,
        c.total_learning_time,
        c.cover_img_url,
        c.vdo_trailer_url,
        c.published,
        c.published_at,
        c.created_at,
        c.updated_at,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id',        cm.id,
                'title',     cm.title,
                'file_name', cm.file_name,
                'file_url',  cm.file_url,
                'file_type', cm.file_type,
                'file_size', cm.file_size,
                'created_at',cm.created_at
              )
              ORDER BY cm.created_at
            )
            FROM course_materials cm
            WHERE cm.course_id = c.id
          ),
          '[]'::json
        ) AS materials,

        COALESCE(
          json_agg(
            json_build_object(

              'id', l.id,
              'name', l.name,
              'order_index', l.order_index,

              'sub_lessons',
              (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'id', sl.id,
                      'name', sl.name,
                      'vdo_url', sl.vdo_url,
                      'vdo_time', sl.vdo_time,
                      'order_index', sl.order_index
                    )
                    ORDER BY sl.order_index
                  ),
                  '[]'::json
                )
                FROM sub_lessons sl
                WHERE sl.lesson_id = l.id
              ),

              'materials',
              (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'id', lm.id,
                      'file_name', lm.file_name,
                      'file_url', lm.file_url,
                      'file_type', lm.file_type
                    )
                    ORDER BY lm.created_at
                  ),
                  '[]'::json
                )
                FROM lesson_materials lm
                WHERE lm.lesson_id = l.id
              )

            )
            ORDER BY l.order_index
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'::json
        ) AS lessons

      FROM courses c

      LEFT JOIN lessons l
        ON l.course_id = c.id

      WHERE c.id = $1

      GROUP BY c.id
      `,
      [id]
    )

    /* ---------------- NOT FOUND ---------------- */

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" })
    }

    /* ---------------- SUCCESS ---------------- */

    return res.status(200).json(result.rows[0])

  } catch (error) {

    console.error("Fetch admin course error:", error)

    return res.status(500).json({
      message: "Internal server error"
    })
  }

}