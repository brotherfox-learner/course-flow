import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function isValidDateString(dateString) {
  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return date <= today
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email)
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {

    const {
      firstName,
      lastName,
      birthDate,
      educationalBackground,
      email,
      password,
    } = req.body || {}

    const role = "student"

    /* sanitize input */

    const cleanFirstName = firstName?.trim()
    const cleanLastName = lastName?.trim()
    const cleanEmail = email?.trim().toLowerCase()

    /* required fields */

    if (!cleanFirstName || !cleanLastName || !birthDate || !cleanEmail || !password) {
      return res.status(400).json({
        message: "Missing required fields"
      })
    }

    /* email validation */

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        message: "Invalid email format"
      })
    }

    /* password validation */

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      })
    }

    /* birthdate validation */

    if (!isValidDateString(birthDate)) {
      return res.status(400).json({
        message: "Invalid date of birth"
      })
    }

    /* supabase signup */

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          first_name: cleanFirstName,
          last_name: cleanLastName,
          birth_date: birthDate,
          educational_background: educationalBackground || null,
          role: role,
        },
      },
    })

    if (error) {
      return res.status(400).json({
        message: error.message
      })
    }

    return res.status(201).json({
      message: "Register success"
    })

  } catch (err) {

    console.error("Register API error:", err)

    return res.status(500).json({
      message: "Internal server error"
    })
  }
}