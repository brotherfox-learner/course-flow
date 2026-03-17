import { Mail } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Lottie from "lottie-react"
import SentEmail from "@/assets/animation/Sent-Email.json"

function EmailCheck() {

    const router = useRouter()

    const [oldEmail, setOldEmail] = useState("boss120244@gmail.com")
    const [newEmail, setNewEmail] = useState("boss120244@gmail.com")

    useEffect(() => {

        const old = sessionStorage.getItem("emailChangeOld")
        const next = sessionStorage.getItem("emailChangeNew")

        if (!old || !next) {
            router.replace("/profile")
            return
        }

        setOldEmail(old)
        setNewEmail(next)

    }, [router])

    return (
        <div className="relative bg-white h-screen px-4 py-10 overflow-hidden">

            <div className="flex flex-col items-center gap-10 max-w-[798px] py-10 mx-auto bg-gray-100 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                    <h3 className="headline3 text-black lg:headline2">
                        Check your email
                    </h3>
                    <Lottie
                        animationData={SentEmail}
                        loop={false}
                        className="w-[200px]"
                    />
                </div>
                <p className="flex flex-col items-center gap-2 text-center body2 lg:body1">
                    <span>We sent confirmation links to</span>
                    <span className="font-bold">
                        {oldEmail}
                    </span>
                    <span>and</span>
                    <span className="font-bold">
                        {newEmail}
                    </span>
                    <span>
                        Please confirm both emails
                    </span>
                </p>

            </div>
            <div className="absolute left-[-55px] bottom-7 z-0 rotate-340 w-22 h-30 rounded-full bg-orange-100 lg:w-80 lg:h-83 lg:top-[200px] lg:left-[-250px]"></div>
            <div className="absolute left-[-19px] top-[193px] w-8 h-8 rounded-full bg-blue-200 lg:w-19 lg:h-19 lg:top-[81px] lg:left-[87px]"></div>
            <img
                src="/vector_7.svg"
                alt="blue shape"
                className="absolute right-0 top-43 lg:hidden"
            />
            <img
                src="/vector_8.svg"
                alt="blue shape"
                className="hidden absolute right-0 top-[-88px] lg:block"
            />
            <img
                src="/orange_bold_circle.svg"
                alt="orange circle"
                className="absolute right-4 top-[400px] w-[10px] h-[9px] lg:hidden"
            />
            <img
                src="/orange_circle.svg"
                alt="orange circle"
                className="hidden absolute right-15 top-[500px] lg:block"
            />
            <div className="hidden absolute top-[196px] left-[187px] text-[#2FAC61] text-5xl rotate-20 lg:block">
                +
            </div>
        </div>
    )
}

export default EmailCheck