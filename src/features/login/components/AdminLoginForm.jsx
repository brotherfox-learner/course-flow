import { useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminLoginForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    // TODO: Replace with Supabase Auth
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (
        formData.email === "admin@courseflow.com" &&
        formData.password === "admin123"
      ) {
        router.push("/")
      } else {
        setSubmitError("Invalid email or password")
      }
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear2 p-4">
      {/* Login Card */}
      <div className="w-full max-w-[566px] bg-white rounded-lg shadow-1 flex flex-col items-center px-[60px] py-[60px] pb-[80px] gap-[46px]">
        {/* Header */}
        <div className="flex flex-col items-center gap-6">
          {/* CourseFlow Logo */}
          <span className="text-4xl font-extrabold brand-gradient-text">
            CourseFlow
          </span>
          {/* Title */}
          <h2 className="headline3 font-bold text-gray-700 text-center">
            Admin Panel Control
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-10"
        >
          {/* Submit Error */}
          {submitError && (
            <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3">
              <p className="body3 text-orange-500">{submitError}</p>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="email" className="body2 text-black font-normal">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
              className="h-12 border-gray-400 rounded-lg px-3 body2 placeholder:text-gray-600"
            />
            {errors.email && (
              <p className="body4 text-orange-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="password" className="body2 text-black font-normal">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              className="h-12 border-gray-400 rounded-lg px-3 body2 placeholder:text-gray-600"
            />
            {errors.password && (
              <p className="body4 text-orange-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-[60px] bg-blue-500 hover:bg-blue-600 text-white font-bold body2 rounded-xl shadow-1 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              "Log in"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
