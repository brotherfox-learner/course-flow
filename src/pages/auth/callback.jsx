import { useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/infrastructure/supabase"

export default function AuthCallback() {

  const router = useRouter()

  useEffect(() => {

    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace("#", "?"))

    const type = params.get("type")
    const message = params.get("message")

    /* SUCCESS EMAIL CHANGE */

    if (type === "email_change") {
      router.replace("/auth/email-change-status?success=1")
      return
    }

    /* FIRST CONFIRM */

    if (message?.includes("Confirmation link accepted")) {
      router.replace("/auth/email-change-status")
      return
    }

    /* NORMAL AUTH FLOW */

    const { data: listener } =
      supabase.auth.onAuthStateChange((event, session) => {

        if (!session) {
          router.replace("/login")
          return
        }

        sessionStorage.removeItem("verifyEmail")

        router.replace("/profile")

      })

    return () => listener.subscription.unsubscribe()

  }, [router])

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="animate-spin w-10 h-10 border-5 border-blue-500 border-t-transparent rounded-full" />
      <p className="body1 text-black">
        Signing you in...
      </p>
    </div>
  )
}