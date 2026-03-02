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

  try {
    let assignments = []

    // Try with submission join first, fall back to without if table doesn't exist
    try {
      const res2 = await pool.query(
        `SELECT
           a.id AS assignment_id,
           a.sub_lesson_id,
           sl.name  AS sub_lesson_name,
           l.name   AS lesson_name,
           c.id     AS course_id,
           c.course_name,
           c.cover_img_url,
           s.id     AS submission_id,
           s.status AS submission_status,
           s.is_correct AS submission_is_correct,
           s.submitted_at,
           (SELECT COUNT(*) FROM assignment_questions aq WHERE aq.assignment_id = a.id)::int AS question_count
         FROM assignments a
         JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
         JOIN lessons l ON l.id = sl.lesson_id
         JOIN courses c ON c.id = l.course_id
         JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
           AND (e.status = 'active' OR e.status = 'completed')
         LEFT JOIN assignment_submissions s
           ON s.assignment_id = a.id AND s.user_id = $1
         ORDER BY c.course_name ASC, a.id ASC`,
        [user.id]
      )
      assignments = res2.rows
    } catch (queryErr) {
      console.warn("Submissions table may not exist, falling back:", queryErr.message)
      // Fallback: no submission join
      const res2 = await pool.query(
        `SELECT
           a.id AS assignment_id,
           a.sub_lesson_id,
           sl.name  AS sub_lesson_name,
           l.name   AS lesson_name,
           c.id     AS course_id,
           c.course_name,
           c.cover_img_url,
           NULL::int  AS submission_id,
           NULL::text AS submission_status,
           NULL::boolean AS submission_is_correct,
           NULL::timestamptz AS submitted_at,
           (SELECT COUNT(*) FROM assignment_questions aq WHERE aq.assignment_id = a.id)::int AS question_count
         FROM assignments a
         JOIN sub_lessons sl ON sl.id = a.sub_lesson_id
         JOIN lessons l ON l.id = sl.lesson_id
         JOIN courses c ON c.id = l.course_id
         JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
           AND (e.status = 'active' OR e.status = 'completed')
         ORDER BY c.course_name ASC, a.id ASC`,
        [user.id]
      )
      assignments = res2.rows
    }

    return res.status(200).json({ assignments })
  } catch (error) {
    console.error("Fetch assignments error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
