import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const { newEmail, password } = req.body

  if (!newEmail || !password) {
    return res.status(400).json({ message: "Missing fields" })
  }

  /* verify password */

  const { error: signInError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password
    })

  if (signInError) {
    return res.status(400).json({
      message: "Incorrect password"
    })
  }

  /* trigger email change verification */

  const { error: updateError } =
    await supabase.auth.updateUser(
      { email: newEmail },
      {
        emailRedirectTo: "http://localhost:3000/auth/callback"
      }
    )

  if (updateError) {
    return res.status(400).json({
      message: updateError.message
    })
  }

  return res.status(200).json({
    message: "Verification email sent"
  })
}