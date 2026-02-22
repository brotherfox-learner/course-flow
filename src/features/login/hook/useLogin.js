import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthContext"

export default function useLogin() {
  const router = useRouter()
  const { login } = useAuth()

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (errors.form) {
      setErrors({})
    }
  }

  const submit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      setErrors({ form: "Email and password are required" })
      return
    }

    try {
      setIsLoading(true)
      setErrors({})

      const res = await axios.post("/api/login", form)

      // ✅ เก็บข้อมูลจาก API เข้า Context
      login({
        user: res.data.user,
        accessToken: res.data.session.accessToken,
      })

      // ✅ redirect หลัง login
      router.push("/")
    } catch (err) {
      setErrors({
        form:
          err.response?.data?.message ||
          "Login failed. Please ensure your email and password are correct",
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