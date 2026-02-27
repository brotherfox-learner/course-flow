// hooks/useProfile.js
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/context/AuthContext"
import { validateProfile } from "./validateProfile"
import { getCroppedImage } from "../utils/cropImage"

function formatDateForApi(date) {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function useProfile() {
  const { profile, token, fetchProfile } = useAuth()

  /* ================= form ================= */
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: null,
    educationalBackground: "",
    email: "",
  })

  /* ================= avatar states ================= */
  const [imageUrl, setImageUrl] = useState(null)          // รูปที่แสดง (หลัง confirm)
  const [imageFile, setImageFile] = useState(null)        // ไฟล์ที่พร้อม upload
  const [originalFile, setOriginalFile] = useState(null) // 🔥 ไฟล์ต้นฉบับ
  const [pendingImageUrl, setPendingImageUrl] = useState(null) // blob สำหรับ crop

  const [isCropping, setIsCropping] = useState(false)
  const [hasCropped, setHasCropped] = useState(false)

  /* ================= crop states ================= */
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  /* ================= effects ================= */
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

  // cleanup เฉพาะ pending blob
  useEffect(() => {
    return () => {
      if (pendingImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImageUrl)
      }
    }
  }, [pendingImageUrl])

  /* ================= handlers ================= */
  function onCropComplete(_, croppedPixels) {
    setCroppedAreaPixels(croppedPixels)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  // ✅ เลือกรูป (ครั้งแรก)
  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setOriginalFile(file) // 🔥 เก็บไฟล์ต้นฉบับ

    const previewUrl = URL.createObjectURL(file)
    setPendingImageUrl(previewUrl)
    setIsCropping(true)
    setHasCropped(false)
  }
  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
  
    // clear previous image error
    setErrors(prev => ({ ...prev, avatar: null }))
  
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]
  
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        avatar: "Only JPG, PNG, or WebP images are allowed.",
      }))
      e.target.value = ""
      return
    }
  
    const MAX_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_SIZE) {
      setErrors(prev => ({
        ...prev,
        avatar: "Image size must be smaller than 2MB.",
      }))
      e.target.value = ""
      return
    }
  
    // valid file
    const objectUrl = URL.createObjectURL(file)
  
    setOriginalFile(file)
    setPendingImageUrl(objectUrl)
    setIsCropping(true)
    setHasCropped(false)
  }

  // ✅ Crop again → ใช้ไฟล์ต้นฉบับ
  function handleCropAgain() {
    if (!originalFile) return

    const previewUrl = URL.createObjectURL(originalFile)
    setPendingImageUrl(previewUrl)
    setIsCropping(true)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  // ✅ Confirm crop
  async function handleConfirmCrop() {
    if (!croppedAreaPixels || !originalFile) return

    const sourceUrl = URL.createObjectURL(originalFile)
    const croppedBlob = await getCroppedImage(sourceUrl, croppedAreaPixels)
    URL.revokeObjectURL(sourceUrl)

    const croppedUrl = URL.createObjectURL(croppedBlob)

    setImageFile(new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" }))
    setImageUrl(croppedUrl)
    setPendingImageUrl(null)
    setIsCropping(false)
    setHasCropped(true)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  // ✅ Cancel crop → ไม่เปลี่ยนรูป
  function handleCancelCrop() {
    setPendingImageUrl(null)
    setIsCropping(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  // ✅ Remove photo
  function handleRemovePhoto() {
    setOriginalFile(null)
    setImageFile(null)
    setImageUrl(null)
    setPendingImageUrl(null)
    setHasCropped(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  /* ================= submit ================= */
  const submit = async (e) => {
    e.preventDefault()
    const validationErrors = validateProfile(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setIsLoading(true)

      let uploadedAvatarUrl = imageUrl

      if (imageFile) {
        const ext = imageFile.name.split(".").pop()
        const filePath = `avatars/${profile.id}.${ext}`

        const { error } = await supabase.storage
          .from("avatars")
          .upload(filePath, imageFile, { upsert: true })

        if (error) throw error

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        uploadedAvatarUrl = data.publicUrl
      }

      await axios.put(
        "/api/auth/profile",
        {
          ...form,
          birthDate: formatDateForApi(form.birthDate),
          avatarUrl: uploadedAvatarUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      await fetchProfile(token)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    form,
    imageUrl,
    pendingImageUrl,
    crop,
    setCrop,
    zoom,
    setZoom,
    isCropping,
    hasCropped,
    isLoading,
    errors,
    handleChange,
    handleImageChange,
    handleCropAgain,
    handleConfirmCrop,
    handleCancelCrop,
    handleRemovePhoto,
    onCropComplete,
    submit,
  }
}