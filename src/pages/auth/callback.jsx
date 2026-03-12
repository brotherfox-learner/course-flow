import { useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallback() {
    const router = useRouter()

    useEffect(() => {
        let mounted = true
        const handleAuth = async () => {

            const { data, error } = await supabase.auth.getSession()

            if (!mounted) return

            if (error) {
                console.error(error)
                router.replace("/login")
                return
            }

            if (data.session) {
                // cleanup verify email state
                sessionStorage.removeItem("verifyEmail")
                router.replace("/profile")
            } else {
                router.replace("/login")
            }
        }
        handleAuth()
        return () => {
            mounted = false
        }
    }, [router])
    
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <div className="animate-spin w-10 h-10 border-5 border-blue-500 border-t-transparent rounded-full" />
            <p className="body1 text-black">Signing you in...</p>
        </div>
    )
}