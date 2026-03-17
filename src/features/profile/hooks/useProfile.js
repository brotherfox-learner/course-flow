// hooks/useProfile.js
import { useState, useEffect } from "react"
import { useAuth } from "@/features/auth/context/AuthContext"
import { validateProfile } from "./validateProfile"
import { getCroppedImage } from "../utils/cropImage"
import { supabase } from "@/infrastructure/supabase"
import { toast } from "sonner"
import { updateProfile, uploadAvatar } from "../services/profile.service"

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

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: null,
    educationalBackground: "",
    email: "",
  })

  const [imageUrl, setImageUrl] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [pendingImageUrl, setPendingImageUrl] = useState(null)

  const [isCropping, setIsCropping] = useState(false)
  const [hasCropped, setHasCropped] = useState(false)

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  /* =========================
   INIT PROFILE DATA
   ========================= */

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

  /* =========================
   CLEANUP BLOB URLS
   ========================= */

  useEffect(() => {
    return () => {
      if (pendingImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImageUrl)
      }
    }
  }, [pendingImageUrl])

  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  /* =========================
   HANDLERS
   ========================= */

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

  function handleCropAgain() {
    if (!originalFile) return

    const previewUrl = URL.createObjectURL(originalFile)

    setPendingImageUrl(previewUrl)
    setIsCropping(true)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  async function handleConfirmCrop() {
    if (!croppedAreaPixels || !originalFile) return

    const sourceUrl = URL.createObjectURL(originalFile)

    const croppedBlob = await getCroppedImage(
      sourceUrl,
      croppedAreaPixels
    )

    URL.revokeObjectURL(sourceUrl)

    const croppedUrl = URL.createObjectURL(croppedBlob)

    setImageFile(
      new File([croppedBlob], "avatar.jpg", {
        type: "image/jpeg",
      })
    )

    setImageUrl(croppedUrl)
    setPendingImageUrl(null)
    setIsCropping(false)
    setHasCropped(true)

    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  function handleCancelCrop() {
    setPendingImageUrl(null)
    setIsCropping(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

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
   SUBMIT PROFILE
   ========================= */

  const submit = async (e) => {
    e.preventDefault()

    const validationErrors = validateProfile(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

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

      /* =========================
         Upload avatar (if changed)
      ========================= */

      if (imageFile) {
        uploadedAvatarUrl = await uploadAvatar(supabase, profile.id, imageFile)
      }

      await updateProfile(token, {
        ...form,
        birthDate: formatDateForApi(form.birthDate),
        avatarUrl: uploadedAvatarUrl,
      })

      await fetchProfile(token)

      toast.success("Profile updated successfully")

      setErrors(prev => ({ ...prev, avatar: null }))
      setHasCropped(false)
      setOriginalFile(null)
      setImageFile(null)

    } catch (error) {

      console.error("Profile update error:", error)

      toast.error(
        error.response?.data?.message ||
        "Failed to update profile"
      )

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