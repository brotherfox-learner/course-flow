import { useRouter } from "next/router"
import { Mail, CheckCircle } from "lucide-react"
import Button from "@/common/navbar/Button"

export default function EmailChangeStatus() {

  const router = useRouter()

  const success = router.query.success === "1"

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height))]">

      {!success && (
        <div className="flex flex-col items-center justify-center gap-8 w-[600px] h-[350px] rounded-2xl text-white bg-linear2">
          <Mail size={100} color="#FFFFFF" />

          <h3 className="headline3">
            Email change in progress
          </h3>

          <p className="text-center max-w-[400px]">
            Please confirm the link sent to both email addresses
            to complete the change.
          </p>

        </div>
      )}

      {success && (
        <div className="flex flex-col items-center justify-center gap-8 w-[600px] h-[350px] rounded-2xl text-white bg-linear2">
          <CheckCircle size={100} color="#FFFFFF" />
          <h3 className="headline3">
            Email updated successfully
          </h3>

          <Button
            variant="primary"
            onClick={() => router.push("/profile")}
          >
            Go to Profile
          </Button>


        </div>
      )}

    </div>
  )
}