import { useRouter } from "next/router"
import { Mail, CheckCircle } from "lucide-react"
import Button from "@/common/navbar/Button"
import Lottie from "lottie-react"
import LoadingEmail from "@/assets/animation/Loading-email-blue.json"
import CheckMark from "@/assets/animation/Rolling-Check-Mark.json"
export default function EmailChangeStatus() {

  const router = useRouter()

  const success = router.query.success === "1"

  return (
    <div className="relative bg-white min-h-[calc(100vh-var(--navbar-height))] overflow-hidden">
      <div className="mt-45">
        {!success && (
          <div className="flex flex-col items-center justify-center gap-8 text-black bg-white">
            <div className="flex flex-col items-center">
              <Lottie
                animationData={LoadingEmail}
                loop={true}
                className="w-[300px]"
              />

              <h3 className="headline3 lg:headline2">
                Email change in progress
              </h3>
            </div>

            <p className="text-center max-w-[343px] body2 lg:max-w-[400px] lg:body1">
              Please confirm the link sent to both email addresses
              to complete the change.
            </p>

          </div>
        )}

        {success && (
          <div className="flex flex-col items-center justify-center gap-8 text-black">
            <div className="flex flex-col items-center">
              <Lottie
                animationData={CheckMark}
                loop={false}
                className="w-[200px]"
              />

              <h3 className="headline3">
                Email updated successfully
              </h3>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/profile")}
            >
              Go to Profile
            </Button>


          </div>
        )}

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