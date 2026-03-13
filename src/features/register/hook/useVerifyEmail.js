import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"


export default function useVerifyEmail(email, setCooldown) {

  const [loading, setLoading] = useState(false)

  const resendEmail = async () => {
    if (!email) return

    try {
      setLoading(true)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
      })

      if (error) throw error

      toast.success("Verification email sent")

      setCooldown(60)   // reset timer

    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    resendEmail,
    loading
  }
}