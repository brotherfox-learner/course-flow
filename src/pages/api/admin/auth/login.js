import { createClient } from "@supabase/supabase-js"
import pool from "@/utils/db"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    })
  }

  try {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    // 2. Check if user is admin in our database
    const result = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [authData.user.id]
    )

    if (result.rows.length === 0 || result.rows[0].role !== "admin") {
      // If not admin, sign them out immediately
      await supabase.auth.signOut()
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      })
    }

    // 3. Return success response
    return res.status(200).json({
      message: "Admin login success",
      user: {
        id: authData.user.id,
        role: "admin",
        email: authData.user.email,
        firstName: authData.user.user_metadata?.first_name,
        lastName: authData.user.user_metadata?.last_name,
      },
      session: {
        accessToken: authData.session.access_token,
        expiresAt: authData.session.expires_at,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return res.status(500).json({
      message: "Internal server error during login",
    })
  }
}
