// hooks/useProfile.js
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/context/AuthContext"
import { validateProfile } from "./validateProfile"

function formatDateForApi(date) {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function useProfile() {
  const { profile, token, fetchProfile } = useAuth()

  const [form, setForm] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    birthDate: profile?.birthDate ? new Date(profile.birthDate) : null,
    educationalBackground: profile?.educationalBackground || "",
    email: profile?.email || "",
  })

  const [imageUrl, setImageUrl] = useState(profile?.avatarUrl || null)
  const [imageFile, setImageFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!profile) return
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      birthDate: profile.birthDate ? new Date(profile.birthDate) : null,
      educationalBackground: profile.educationalBackground || "",
      email: profile.email || "",
    })
    setImageUrl(profile.avatarUrl || null)
  }, [profile])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImageUrl(URL.createObjectURL(file))
    }
  }

  function handleRemovePhoto() {
    setImageFile(null)
    setImageUrl(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    const validationErrors = validateProfile(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    try {
      setIsLoading(true)
      setErrors({})

      let uploadedAvatarUrl = imageUrl // ใช้ url เดิมถ้าไม่ได้เปลี่ยนรูป

      // ถ้ามีไฟล์ใหม่ ให้ upload ก่อน
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()
        const filePath = `avatars/${profile.id}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, imageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        uploadedAvatarUrl = data.publicUrl
      }

      const payload = {
        ...form,
        birthDate: formatDateForApi(form.birthDate),
        avatarUrl: uploadedAvatarUrl,
      }

      await axios.put("/api/auth/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // refresh profile ใน context
      await fetchProfile(token)

    } catch (err) {
      setErrors({ form: err.response?.data?.message || "Update failed" })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    form,
    imageUrl,
    errors,
    isLoading,
    handleChange,
    handleImageChange,
    handleRemovePhoto,
    submit,
  }
}