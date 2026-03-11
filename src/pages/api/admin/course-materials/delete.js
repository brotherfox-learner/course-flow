import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
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

  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const { id } = req.body

  if (!id) {
    return res.status(400).json({ message: "id is required" })
  }

  try {
    // Fetch the file_url before deleting
    const materialRes = await pool.query(
      `SELECT id, file_url FROM course_materials WHERE id = $1`,
      [id]
    )

    if (materialRes.rows.length === 0) {
      return res.status(404).json({ message: "Material not found" })
    }

    const fileUrl = materialRes.rows[0].file_url

    // Delete from DB
    await pool.query(`DELETE FROM course_materials WHERE id = $1`, [id])

    // Delete from Supabase Storage (after DB delete)
    if (fileUrl) {
      try {
        const u = new URL(fileUrl)
        const match = u.pathname.match(/\/storage\/v1\/object\/public\/course-materials\/(.+)/)
        if (match) {
          const { error: storageErr } = await supabase.storage
            .from("course-materials")
            .remove([match[1]])
          if (storageErr) console.error("Supabase storage delete error:", storageErr)
        }
      } catch (e) {
        console.error("Storage cleanup error:", e)
      }
    }

    return res.status(200).json({ message: "Material deleted" })
  } catch (error) {
    console.error("Delete course material error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
