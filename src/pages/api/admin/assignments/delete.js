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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const { assignment_id } = req.body

  if (!assignment_id) {
    return res.status(400).json({ message: "assignment_id is required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Delete submission chain
    await client.query(
      `DELETE FROM submission_selected_options WHERE submission_answer_id IN (
        SELECT sa.id FROM submission_answers sa
        JOIN assignment_submissions asub ON sa.submission_id = asub.id
        WHERE asub.assignment_id = $1
      )`, [assignment_id]
    )
    await client.query(
      `DELETE FROM submission_answers WHERE submission_id IN (
        SELECT id FROM assignment_submissions WHERE assignment_id = $1
      )`, [assignment_id]
    )
    await client.query(
      `DELETE FROM assignment_submissions WHERE assignment_id = $1`,
      [assignment_id]
    )

    // Delete question chain
    await client.query(
      `DELETE FROM question_options WHERE question_id IN (
        SELECT id FROM assignment_questions WHERE assignment_id = $1
      )`, [assignment_id]
    )
    await client.query(
      `DELETE FROM assignment_questions WHERE assignment_id = $1`,
      [assignment_id]
    )

    // Delete assignment
    await client.query(`DELETE FROM assignments WHERE id = $1`, [assignment_id])

    await client.query("COMMIT")
    return res.status(200).json({ message: "Assignment deleted" })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Delete assignment error:", error)
    return res.status(500).json({ message: "Internal server error" })
  } finally {
    client.release()
  }
}
