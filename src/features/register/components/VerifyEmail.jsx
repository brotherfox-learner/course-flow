import Button from "@/common/navbar/Button"
import { Mail } from "lucide-react"
import useVerifyEmail from "../hook/useVerifyEmail"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthContext"
import Lottie from "lottie-react"
import Email from "@/assets/animation/Email.json"

function VerifyEmail() {

    const router = useRouter()
    const { isLoggedIn } = useAuth()

    const [email, setEmail] = useState(null)
    const [cooldown, setCooldown] = useState(60)

    const { resendEmail, loading } = useVerifyEmail(email, setCooldown)


    useEffect(() => {

        const storedEmail = sessionStorage.getItem("verifyEmail")

        if (!storedEmail) {
            router.replace("/register")
            return
        }

        setEmail(storedEmail)

    }, [router])


    useEffect(() => {
        const channel = new BroadcastChannel("auth")
        channel.onmessage = (event) => {
            if (event.data === "login") {
                router.replace("/profile")
            }

        }
        return () => channel.close()

    }, [router])


    useEffect(() => {

        if (isLoggedIn) {
            router.replace("/profile")
        }

    }, [isLoggedIn, router])


    useEffect(() => {

        const timer = setInterval(() => {

            setCooldown((prev) => {

                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }

                return prev - 1

            })

        }, 1000)

        return () => clearInterval(timer)

    }, [])

    const openEmail = () => {

        if (!email) return

        const domain = email.split("@")[1]

        const providers = {
            "gmail.com": "https://mail.google.com",
            "outlook.com": "https://outlook.live.com/mail",
            "hotmail.com": "https://outlook.live.com/mail",
            "yahoo.com": "https://mail.yahoo.com",
            "icloud.com": "https://www.icloud.com/mail"
        }

        const url = providers[domain]

        if (url) {
            window.open(url, "_blank")
        } else {
            window.location.href = `mailto:${email}`
        }

    }

    return (

        <div className="relative bg-white h-screen px-4 py-10 overflow-hidden">
            <div className="flex flex-col items-center gap-7 max-w-[798px] py-10 mx-auto bg-gray-100 rounded-2xl">
                <div className="flex flex-col items-center">
                    <h3 className="headline3 text-black lg:headline2">
                        Check your email
                    </h3>
                    <Lottie
                        animationData={Email}
                        loop={false}
                        className="w-[250px]"
                    />
                </div>
                <p className="flex flex-col items-center gap-2">
                    <span className="body3 lg:body1">
                        We’ve sent a verification link to your email.
                    </span>
                    <span className="body3 lg:body1">
                        Please check your inbox and verify your account.
                    </span>
                </p>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={openEmail}
                >
                    Open Email
                </Button>

                <div className="flex items-center gap-2">
                    <span className="body3 lg:body2 text-black">
                        Didn't receive the email?
                    </span>

                    <Button
                        onClick={resendEmail}
                        disabled={loading || cooldown > 0}
                        variant="ghost"
                        size="sm"
                        className="p-0! body3 lg:body2 font-bold!"
                    >
                        {loading
                            ? "Sending..."
                            : cooldown > 0
                                ? `Resend in ${cooldown}s`
                                : "Resend"}
                    </Button>

                </div>

            </div>

            <div className="absolute left-[-55px] bottom-7 z-0 rotate-340 w-22 h-30 rounded-full bg-orange-100 lg:w-80 lg:h-83 lg:top-[200px] lg:left-[-250px]"></div>
            <div className="absolute left-[-19px] top-[193px] w-8 h-8 rounded-full bg-blue-200 lg:w-19 lg:h-19 lg:top-[81px] lg:left-[87px]"></div>
            <img
                src="vector_7.svg"
                alt="blue shape"
                className="absolute right-0 top-43 lg:hidden"
            />
            <img
                src="vector_8.svg"
                alt="blue shape"
                className="hidden absolute right-0 top-[-88px] lg:block"
            />
            <img
                src="orange_bold_circle.svg"
                alt="orange circle"
                className="absolute right-4 top-[400px] w-[10px] h-[9px] lg:hidden"
            />
            <img
                src="orange_circle.svg"
                alt="orange circle"
                className="hidden absolute right-15 top-[500px] lg:block"
            />
            <div className="hidden absolute top-[196px] left-[187px] text-[#2FAC61] text-5xl rotate-20 lg:block">
                +
            </div>
        </div>

    )

}

export default VerifyEmail