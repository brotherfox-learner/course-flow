import { useState, useCallback } from "react"
import axios from "axios"
import { useCloudinaryUpload } from "./useCloudinaryUpload"

const INITIAL_FORM = {
  courseName: "",
  price: "",
  totalLearningTime: "",
  courseSummary: "",
  courseDetail: "",
  coverImgUrl: "",
  coverImageData: null,
  vdoTrailerUrl: "",
  videoTrailerData: null,
}

/**
 * Manages form state and submission for the Add Course page.
 * Reuses useCloudinaryUpload for media uploads.
 *
 * @param {string|null} token
 * @param {Function} onSuccess - called with courseId after successful creation
 * @param {Function} onAuthError - called when 401/403 occurs
 */
export function useAddCourse(token, onSuccess, onAuthError) {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bannerStatus, setBannerStatus] = useState("idle")

  const { uploadFileToCloudinary } = useCloudinaryUpload()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleImageUpload = (imageData) => {
    setFormData((prev) => ({ ...prev, coverImageData: imageData, coverImgUrl: "" }))
    if (errors.coverImgUrl) setErrors((prev) => ({ ...prev, coverImgUrl: "" }))
  }

  const handleVideoUpload = (videoData) => {
    setFormData((prev) => ({ ...prev, videoTrailerData: videoData, vdoTrailerUrl: "" }))
    if (errors.vdoTrailerUrl) setErrors((prev) => ({ ...prev, vdoTrailerUrl: "" }))
  }

  const validate = () => {
    const e = {}
    if (!formData.courseName) e.courseName = "Course name is required"
    if (!formData.price) e.price = "Price is required"
    if (!formData.totalLearningTime) e.totalLearningTime = "Total learning time is required"
    if (!formData.courseSummary) e.courseSummary = "Course summary is required"
    if (!formData.courseDetail) e.courseDetail = "Course detail is required"
    if (!formData.coverImageData && !formData.coverImgUrl) e.coverImgUrl = "Cover image is required"
    if (!formData.videoTrailerData && !formData.vdoTrailerUrl) e.vdoTrailerUrl = "Video trailer is required"
    return e
  }

  const handleCreate = useCallback(async (promoPayload, attachedFiles, lessons) => {
    setSubmitError("")
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setBannerStatus("loading")
    try {
      let coverUrl = formData.coverImgUrl
      let videoUrl = formData.vdoTrailerUrl
      if (formData.coverImageData?.file) {
        coverUrl = await uploadFileToCloudinary(formData.coverImageData.file, "image", "course-flow/images")
      }
      if (formData.videoTrailerData?.file) {
        videoUrl = await uploadFileToCloudinary(formData.videoTrailerData.file, "video", "course-flow/videos")
      }

      const res = await axios.post(
        "/api/admin/courses/create",
        {
          course_name: formData.courseName,
          price: Number(formData.price),
          total_learning_time: Number(formData.totalLearningTime),
          course_summary: formData.courseSummary,
          course_detail: formData.courseDetail,
          cover_img_url: coverUrl,
          vdo_trailer_url: videoUrl,
          published: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const courseId = res.data.courseId

      if (courseId && promoPayload) {
        try {
          await axios.post("/api/admin/promocodes/create", promoPayload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        } catch (err) {
          console.error("Create promo code failed:", err)
        }
      }

      if (courseId && attachedFiles.length > 0) {
        await Promise.allSettled(
          attachedFiles.map((f) =>
            fetch("/api/admin/course-materials/create", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                course_id: courseId,
                file_name: f.fileName,
                file_url: f.url,
                file_type: f.fileType,
                file_size: f.fileSize,
              }),
            })
          )
        )
      }

      if (courseId && lessons.length > 0) {
        for (let i = 0; i < lessons.length; i++) {
          try {
            const lesson = lessons[i]
            const subPayload = []
            for (const sub of lesson.subLessons) {
              let vdoUrl = null
              if (sub.videoData?.file) {
                vdoUrl = await uploadFileToCloudinary(sub.videoData.file, "video", "course-flow/videos")
              }
              subPayload.push({
                name: sub.name.trim(),
                order_index: subPayload.length + 1,
                type: "vdo",
                content: vdoUrl,
              })
            }
            await axios.post(
              "/api/admin/lessons/create-with-sublessons",
              { course_id: courseId, lesson_name: lesson.name.trim(), sub_lessons: subPayload },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          } catch (err) {
            console.error(`Create lesson ${i} failed:`, err)
          }
        }
      }

      setBannerStatus("success")
      onSuccess?.()
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        onAuthError?.()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to create course")
      setBannerStatus("error")
      setTimeout(() => setBannerStatus("idle"), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, token, uploadFileToCloudinary, onSuccess, onAuthError]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    formData,
    errors,
    submitError,
    isSubmitting,
    bannerStatus,
    handleChange,
    handleImageUpload,
    handleVideoUpload,
    handleCreate,
  }
}
