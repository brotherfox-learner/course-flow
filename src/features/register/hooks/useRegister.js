import { useState } from "react"
import { useRouter } from "next/router"
import { validateRegister } from "./validateRegister"
import { register as registerApi } from "@/features/auth/services/auth.service"

/* helper: Date → YYYY-MM-DD */
function formatDateForApi(date) {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const initialForm = {
  firstName: "",
  lastName: "",
  birthDate: null, // Date object
  educationalBackground: "",
  email: "",
  password: "",
}


export default function useRegister() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)



  /* DOM-based handler */
  function handleChange(e) {
    const { name, value } = e.target

    // ใช้ callback เพื่อให้ได้ state ล่าสุด และ log ดูค่าได้ทันที
    setForm(prev => ({
      ...prev,
      [name]: value,
    }))

    // clear error เฉพาะ field ที่แก้
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    // ✅ 1. validate ด้วย raw form (Date object)
    const validationErrors = validateRegister(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // ✅ 2. ค่อย transform หลังผ่าน validate
    const apiPayload = {
      ...form,
      birthDate: formatDateForApi(form.birthDate),
    }

    try {
      setIsLoading(true)
      setErrors({})
      const email = form.email
      await registerApi(apiPayload)
      sessionStorage.setItem("verifyEmail", email)
      setForm(initialForm)
      router.push("/verify-email")
    } catch (err) {
      setErrors({
        form: err.response?.data?.message || "Register failed",
      })
    } finally {
      setIsLoading(false)
    }
  }
  return {
    form,
    errors,
    isLoading,
    handleChange,
    submit,
  }
}