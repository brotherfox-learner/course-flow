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


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }


  const {
    firstName,
    lastName,
    birthDate,
    educationalBackground,
    email,
    password,
  } = req.body

  const role = "student"

  // server-side validation (final authority)
  if (!email || !password || !firstName || !lastName || !birthDate) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  if (!isValidDateString(birthDate)) {
    return res.status(400).json({ message: "Invalid date of birth" })
  }

  const cleanEmail = email?.trim().toLowerCase()

  if (!cleanEmail) {
    return res.status(400).json({ message: "Invalid email" })
  }

  const { error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        educational_background: educationalBackground,
        role: role,
      },
    },
  })

  if (error) {
    return res.status(400).json({ message: error.message })
  }

  return res.status(201).json({ message: "Register success" })
}