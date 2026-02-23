// hooks/useLogin.js
import { useState } from "react"
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

      await login(form) // ← จบเลย, session จะ set ผ่าน onAuthStateChange อัตโนมัติ

      router.push("/")
    } catch (err) {
      setErrors({
        form: "Login failed. Please ensure your email and password are correct",
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