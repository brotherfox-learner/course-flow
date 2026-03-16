import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {

  if (req.method !== "PUT") {
    return res.status(405).json({
      message: "Method not allowed"
    })
  }

  try {

    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized"
      })
    }

    const token = authHeader.split(" ")[1]

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        message: "Invalid token"
      })
    }

    const {
      firstName,
      lastName,
      birthDate,
      educationalBackground,
      avatarUrl
    } = req.body


    if (!firstName || !lastName) {
      return res.status(400).json({
        message: "First name and last name are required"
      })
    }


    const result = await pool.query(
      `
      UPDATE users SET
        first_name = $1,
        last_name = $2,
        birth_date = $3,
        educational_background = $4,
        avatar_url = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING
        id,
        first_name,
        last_name,
        birth_date,
        educational_background,
        avatar_url
      `,
      [
        firstName,
        lastName,
        birthDate,
        educationalBackground,
        avatarUrl,
        user.id
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    const dbUser = result.rows[0]

    return res.status(200).json({
      id: dbUser.id,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      birthDate: dbUser.birth_date,
      educationalBackground: dbUser.educational_background,
      avatarUrl: dbUser.avatar_url,
    })

  } catch (error) {

    console.error("Update profile error:", error)

    return res.status(500).json({
      message: "Internal server error"
    })

  }

}