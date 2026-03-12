import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

export default function useVerifyEmail(email) {

  const [loading, setLoading] = useState(false)

  const resendEmail = async () => {

    if (!email) {
      toast.error("Email not found. Please register again.")
      return
    }

    try {

      setLoading(true)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email
      })

      if (error) throw error

      toast.success("Verification email sent. Please check your inbox.")

    } catch (err) {

      console.error(err)

      toast.error(err.message || "Failed to send verification email")

    } finally {

      setLoading(false)

    }
  }

  return {
    resendEmail,
    loading
  }
}