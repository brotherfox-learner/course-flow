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

    /* verify token */

    const { data: { user }, error: authError } =
        await supabase.auth.getUser(token)

    if (authError || !user) {
        return res.status(401).json({ message: "Invalid token" })
    }

    const { email, newEmail, password } = req.body

    /* verify current email */
    if (!email || !newEmail || !password) {
        return res.status(400).json({
            message: "Missing required fields"
        })
    }
    
    if (email !== user.email) {
        return res.status(400).json({
            message: "Current email does not match"
        })
    }
    if (newEmail === user.email) {
        return res.status(400).json({
          message: "New email must be different"
        })
      }
    const emailRegex = /\S+@\S+\.\S+/

    if (!emailRegex.test(newEmail)) {
        return res.status(400).json({
            message: "Invalid email format"
        })
    }

    /* verify password */

    const { error: signInError } =
        await supabase.auth.signInWithPassword({
            email,
            password
        })

    if (signInError) {
        return res.status(400).json({
            message: "Incorrect password"
        })
    }

    /* update email */

    const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { email: newEmail }
    )

    if (error) {
        return res.status(400).json({ message: error.message })
    }

    return res.status(200).json({
        message: "Email updated successfully"
    })
}