// pages/api/auth/me.js
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

  // verify token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  // raw query แบบ parameterized ($1) ป้องกัน SQL injection
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

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "User not found" })
  }

  const {
    id,
    profile_name,
    first_name,
    last_name,
    educational_background,
    birth_date,
    avatar_url,
    role,
    created_at,
    updated_at,
  } = result.rows[0]
  
  return res.status(200).json({
    id,
    profileName: profile_name,
    firstName: first_name,
    lastName: last_name,
    educationalBackground: educational_background,
    birthDate: birth_date,
    avatarUrl: avatar_url,
    role,
    createdAt: created_at,
    updatedAt: updated_at,
    email: user.email,
  })
}