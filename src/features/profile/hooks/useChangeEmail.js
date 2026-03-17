import { useState } from "react"
import axios from "axios"
import { useAuth } from "@/features/auth/context/AuthContext"
import { useRouter } from "next/router"

export default function useChangeEmail() {

  const { token, user } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({
    newEmail: "",
    password: ""
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {

    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))

    setErrors(prev => ({
      ...prev,
      [name]: ""
    }))
  }

  const validate = () => {

    const newErrors = {}
    const emailRegex = /\S+@\S+\.\S+/

    if (!form.newEmail) {
      newErrors.newEmail = "New email is required"
    }

    else if (!emailRegex.test(form.newEmail)) {
      newErrors.newEmail = "Invalid email format"
    }

    else if (form.newEmail === user.email) {
      newErrors.newEmail = "New email must be different"
    }

    if (!form.password) {
      newErrors.password = "Password is required"
    }

    return newErrors
  }

  const submit = async (e) => {

    e.preventDefault()

    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {

      setIsLoading(true)

      await axios.post(
        "/api/auth/change-email",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      sessionStorage.setItem("emailChangeOld", user.email)
      sessionStorage.setItem("emailChangeNew", form.newEmail)

      router.push("/auth/email-check")

      setForm({
        newEmail: "",
        password: ""
      })

    } catch (error) {

      setErrors({
        form: error.response?.data?.message || "Something went wrong"
      })

    } finally {

      setIsLoading(false)

    }
  }

  return {
    form,
    errors,
    handleChange,
    submit,
    isLoading,
  }
}