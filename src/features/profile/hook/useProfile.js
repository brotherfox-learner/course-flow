// hooks/useProfile.js
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/context/AuthContext"
import { validateProfile } from "./validateProfile"
import { getCroppedImage } from "../utils/cropImage"

/**
 * Convert JS Date -> YYYY-MM-DD (API format)
 */
function formatDateForApi(date) {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function useProfile() {
  const { profile, token, fetchProfile } = useAuth()

  /* =========================
   * FORM STATE
   * ========================= */
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: null,
    educationalBackground: "",
    email: "",
  })

  /* =========================
   * AVATAR STATE (สำคัญ)
   * =========================
   * imageUrl        -> รูปที่แสดงจริง (หลัง confirm crop)
   * imageFile       -> ไฟล์ที่พร้อม upload เข้า Supabase
   * originalFile    -> ไฟล์ต้นฉบับจาก user (ใช้ crop กี่รอบก็ได้)
   * pendingImageUrl -> blob URL สำหรับ modal crop เท่านั้น
   */
  const [imageUrl, setImageUrl] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [pendingImageUrl, setPendingImageUrl] = useState(null)

  const [isCropping, setIsCropping] = useState(false)
  const [hasCropped, setHasCropped] = useState(false)

  /* =========================
   * CROP STATE
   * ========================= */
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  /* =========================
   * UI STATE
   * ========================= */
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  /* =========================
   * INIT PROFILE DATA
   * ========================= */
  useEffect(() => {
    if (!profile) return

    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      birthDate: profile.birthDate ? new Date(profile.birthDate) : null,
      educationalBackground: profile.educationalBackground || "",
      email: profile.email || "",
    })

    // avatarUrl จาก backend (ไม่ใช่ blob)
    setImageUrl(profile.avatarUrl || null)
  }, [profile])

  /* =========================
   * CLEANUP blob สำหรับ modal crop
   * ========================= */
  useEffect(() => {
    return () => {
      if (pendingImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImageUrl)
      }
    }
  }, [pendingImageUrl])

  /* =========================
   * CLEANUP blob สำหรับ avatar preview
   * ========================= */
  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  /* =========================
   * HANDLERS
   * ========================= */

  // react-easy-crop callback
  function onCropComplete(_, croppedPixels) {
    setCroppedAreaPixels(croppedPixels)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  /**
   * User เลือกรูปใหม่ (ครั้งแรก)
   * - validate type / size
   * - เก็บ originalFile ไว้เป็น source กลาง
   * - เปิด modal crop
   */
  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setErrors(prev => ({ ...prev, avatar: null }))

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        avatar: "Only JPG, PNG, or WebP images are allowed.",
      }))
      e.target.value = ""
      return
    }

    const MAX_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setErrors(prev => ({
        ...prev,
        avatar: "Image size must be smaller than 2MB.",
      }))
      e.target.value = ""
      return
    }

    const objectUrl = URL.createObjectURL(file)

    setOriginalFile(file)
    setPendingImageUrl(objectUrl)
    setIsCropping(true)
    setHasCropped(false)
  }

  /**
   * Crop again
   * - ใช้ originalFile เสมอ (ไม่ crop ต่อจาก crop)
   */
  function handleCropAgain() {
    if (!originalFile) return

    const previewUrl = URL.createObjectURL(originalFile)
    setPendingImageUrl(previewUrl)
    setIsCropping(true)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  /**
   * Confirm crop
   * - crop จาก originalFile
   * - สร้าง imageFile สำหรับ upload
   * - แสดง preview
   */
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

  /**
   * Cancel crop
   * - ไม่แตะ imageUrl
   */
  function handleCancelCrop() {
    setPendingImageUrl(null)
    setIsCropping(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  /**
   * Remove avatar ทั้งหมด
   */
  function handleRemovePhoto() {
    setOriginalFile(null)
    setImageFile(null)
    setImageUrl(null)
    setPendingImageUrl(null)
    setHasCropped(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  /* =========================
   * SUBMIT PROFILE
   * ========================= */
  const submit = async (e) => {
    e.preventDefault()

    const validationErrors = validateProfile(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // ป้องกัน user ลืมกด confirm crop
    if (pendingImageUrl && !hasCropped) {
      setErrors(prev => ({
        ...prev,
        avatar: "Please confirm the photo crop before updating profile.",
      }))
      return
    }

    try {
      setIsLoading(true)
  
      let uploadedAvatarUrl = imageUrl

      // upload เฉพาะเมื่อมีรูปใหม่
      if (imageFile) {
        const filePath = `avatars/${profile.id}?v=${Date.now()}`
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

      // refresh profile จาก backend
      await fetchProfile(token)

      // clear transient states
      setErrors(prev => ({ ...prev, avatar: null }))
      setHasCropped(false)
      setOriginalFile(null)
      setImageFile(null)
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