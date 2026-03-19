import pool from "@/infrastructure/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function ensureAdmin(req) {

  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" }
  }

  const token = authHeader.split(" ")[1]

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { ok: false, status: 401, message: "Invalid token" }
  }

  const roleCheck = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [user.id]
  )

  if (
    roleCheck.rows.length === 0 ||
    roleCheck.rows[0].role !== "admin"
  ) {
    return { ok: false, status: 403, message: "Forbidden" }
  }

  return { ok: true }
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    })
  }

  const auth = await ensureAdmin(req)

  if (!auth.ok) {
    return res.status(auth.status).json({
      message: auth.message
    })
  }

  const { course_id, lesson_name, sub_lessons } = req.body

  if (!course_id || !lesson_name) {
    return res.status(400).json({
      message: "course_id and lesson_name required"
    })
  }

  if (!Array.isArray(sub_lessons) || sub_lessons.length === 0) {
    return res.status(400).json({
      message: "Lesson must contain at least 1 sub-lesson"
    })
  }

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /*
    1️⃣ หา order_index ของ lesson
    */

    const orderRes = await client.query(
      `SELECT COALESCE(MAX(order_index),0)+1 AS next_index
       FROM lessons
       WHERE course_id = $1`,
      [course_id]
    )

    const lessonOrder = orderRes.rows[0].next_index

    /*
    2️⃣ create lesson
    */

    const lessonRes = await client.query(
      `INSERT INTO lessons (course_id, name, order_index)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [course_id, lesson_name, lessonOrder]
    )

    const lessonId = lessonRes.rows[0].id

    /*
    3️⃣ create sub lessons
    */

    for (const sub of sub_lessons) {

      if (!sub.name) {
        throw new Error("Sub lesson name required")
      }

      const vdoUrl = sub.vdo_url ?? (sub.type === "vdo" ? sub.content : null)
      const contentType = sub.content_type ?? "video"
      const content = sub.content_type === "text" ? (sub.content ?? "") : null

      await client.query(
        `INSERT INTO sub_lessons
         (lesson_id, name, order_index, vdo_url, content_type, content)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          lessonId,
          sub.name,
          sub.order_index,
          vdoUrl,
          contentType,
          content
        ]
      )

    }

    await client.query("COMMIT")

    return res.status(201).json({
      message: "Lesson created",
      lesson_id: lessonId
    })

  } catch (err) {

    await client.query("ROLLBACK")

    console.error("Create lesson error:", err)

    return res.status(500).json({
      message: "Internal server error"
    })

  } finally {

    client.release()

  }

}