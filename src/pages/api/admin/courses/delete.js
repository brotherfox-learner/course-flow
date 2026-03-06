import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/*
ตรวจว่าเป็น admin
*/
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

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const auth = await ensureAdmin(req)

  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message })
  }

  const { course_id } = req.body

  if (!course_id) {
    return res.status(400).json({
      message: "course_id required"
    })
  }

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /*
    1️⃣ ลบ sub lessons
    */

    await client.query(`
      DELETE FROM sub_lessons
      WHERE lesson_id IN (
        SELECT id FROM lessons WHERE course_id = $1
      )
    `,[course_id])


    /*
    2️⃣ ลบ lessons
    */

    await client.query(`
      DELETE FROM lessons
      WHERE course_id = $1
    `,[course_id])


    /*
    3️⃣ ลบ course
    */

    const result = await client.query(`
      DELETE FROM courses
      WHERE id = $1
      RETURNING *
    `,[course_id])


    if(result.rows.length === 0){
      await client.query("ROLLBACK")
      return res.status(404).json({
        message:"Course not found"
      })
    }

    await client.query("COMMIT")

    return res.status(200).json({
      message:"Course deleted"
    })

  } catch(err){

    await client.query("ROLLBACK")

    console.error("Delete course error:",err)

    return res.status(500).json({
      message:"Internal server error"
    })

  } finally {

    client.release()

  }

}