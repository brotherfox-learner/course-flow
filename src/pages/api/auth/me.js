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

  try {

    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ message: "Invalid token" })
    }

    const result = await pool.query(
      `SELECT
        id,
        profile_name,
        first_name,
        last_name,
        educational_background,
        birth_date,
        avatar_url,
        role,
        created_at,
        updated_at
      FROM users
      WHERE id = $1`,
      [user.id]
    )

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" })
    }

    const u = result.rows[0]

    return res.status(200).json({
      id: u.id,
      profileName: u.profile_name,
      firstName: u.first_name,
      lastName: u.last_name,
      educationalBackground: u.educational_background,
      birthDate: u.birth_date,
      avatarUrl: u.avatar_url,
      role: u.role,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      email: user.email
    })

  } catch (err) {

    console.error("GET /api/auth/me error:", err)

    return res.status(500).json({
      message: "Internal server error"
    })
  }
}