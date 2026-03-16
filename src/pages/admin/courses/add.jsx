import Head from "next/head"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import AdminLayout from "@/components/layout/AdminLayout"
import { useRouter } from "next/router"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import AttachFileUpload from "@/features/admin-coureses/component/AttachFileUpload"
import VideoUpload from "@/components/upload/VideoUpload"
import ImageUpload from "@/components/upload/ImageUpload"
import LessonBlock from "@/features/admin-lesson/component/LessonBlock"
import SubmitBanner from "@/common/SubmitBanner"
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

let lessonIdCounter = 1
function makeLessonId() {
  return `lesson-${lessonIdCounter++}`
}
let subIdCounter = 1
function makeSubId() {
  return `sub-${subIdCounter++}`
}

export default function AddCourse() {
  const router = useRouter()
  const { token, loading, logout } = useAuth()
  const [hasPromoCode, setHasPromoCode] = useState(false)
  const [promoData, setPromoData] = useState({
    code: "",
    discountType: "percent",
    discountAmount: "",
    discountPercent: "",
    minPurchase: "0",
    validFrom: "",
    validTo: "",
    usageLimit: "",
  })
  const [formData, setFormData] = useState({
    courseName: "",
    price: "",
    totalLearningTime: "",
    courseSummary: "",
    courseDetail: "",
    coverImgUrl: "",
    coverImageData: null,
    vdoTrailerUrl: "",
    videoTrailerData: null,
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bannerStatus, setBannerStatus] = useState("idle")
  const [attachedFiles, setAttachedFiles] = useState([])

  // Lesson management state
  const [lessons, setLessons] = useState([])
  const [lessonErrors, setLessonErrors] = useState({})

  const lessonSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleLessonDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLessons((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === active.id)
      const newIndex = prev.findIndex((l) => l.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const handleAddLesson = () => {
    setLessons((prev) => [
      ...prev,
      {
        id: makeLessonId(),
        name: "",
        subLessons: [{ id: makeSubId(), name: "", videoData: null }],
      },
    ])
  }

  const handleLessonChange = (updated) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l))
    )
  }

  const handleRemoveLesson = (lessonId) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId))
  }

  useEffect(() => {
    if (!loading && !token) {
      router.push("/admin/login")
    }
  }, [loading, token, router])

  const handleVideoUpload = (videoData) => {
    // Just store File locally — NO Cloudinary upload yet
    setFormData(prev => ({ 
      ...prev, 
      videoTrailerData: videoData,
      vdoTrailerUrl: "" 
    }))
    if (errors.vdoTrailerUrl) {
      setErrors(prev => ({ ...prev, vdoTrailerUrl: "" }))
    }
  }

  const handleImageUpload = (imageData) => {
    // Just store File locally — NO Cloudinary upload yet
    setFormData(prev => ({ 
      ...prev, 
      coverImageData: imageData,
      coverImgUrl: "" 
    }))
    if (errors.coverImgUrl) {
      setErrors(prev => ({ ...prev, coverImgUrl: "" }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.courseName) newErrors.courseName = "Course name is required"
    if (!formData.price) newErrors.price = "Price is required"
    if (!formData.totalLearningTime) newErrors.totalLearningTime = "Total learning time is required"
    if (!formData.courseSummary) newErrors.courseSummary = "Course summary is required"
    if (!formData.courseDetail) newErrors.courseDetail = "Course detail is required"
    if (!formData.coverImageData && !formData.coverImgUrl) newErrors.coverImgUrl = "Cover image is required"
    if (!formData.videoTrailerData && !formData.vdoTrailerUrl) newErrors.vdoTrailerUrl = "Video trailer is required"
    return newErrors
  }

  // Helper: upload a File to Cloudinary via signature API
  const uploadFileToCloudinary = async (file, resourceType, folder) => {
    // 1) Get signature
    const sigRes = await fetch("/api/upload/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_type: resourceType, folder }),
    })
    if (!sigRes.ok) throw new Error("Failed to get upload signature")
    const sig = await sigRes.json()

    // 2) Upload to Cloudinary
    const fd = new FormData()
    fd.append("file", file)
    fd.append("timestamp", sig.timestamp)
    fd.append("signature", sig.signature)
    fd.append("api_key", sig.api_key)
    fd.append("folder", sig.folder)
    fd.append("upload_preset", sig.upload_preset)

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`,
      { method: "POST", body: fd }
    )
    if (!uploadRes.ok) throw new Error("Cloudinary upload failed")
    const data = await uploadRes.json()
    if (data.error) throw new Error(data.error.message)
    return data.secure_url
  }

  const handleCreate = async () => {
    setSubmitError("")

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setBannerStatus("loading")
    try {
      // Upload files to Cloudinary NOW (only on submit)
      let coverUrl = formData.coverImgUrl
      let videoUrl = formData.vdoTrailerUrl

      if (formData.coverImageData?.file) {
        coverUrl = await uploadFileToCloudinary(
          formData.coverImageData.file, "image", "course-flow/images"
        )
      }
      if (formData.videoTrailerData?.file) {
        videoUrl = await uploadFileToCloudinary(
          formData.videoTrailerData.file, "video", "course-flow/videos"
        )
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
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const courseId = res.data.courseId

      /* Create promo code locked to this course only */
      if (courseId && hasPromoCode && promoData.code) {
        try {
          await axios.post(
            "/api/admin/promocodes/create",
            {
              code: promoData.code,
              name: promoData.code,
              discount_type: promoData.discountType === "thb" ? "fixed" : "percent",
              discount_value:
                promoData.discountType === "thb"
                  ? Number(promoData.discountAmount)
                  : Number(promoData.discountPercent),
              min_price: Number(promoData.minPurchase) || 0,
              max_uses: promoData.usageLimit ? Number(promoData.usageLimit) : null,
              valid_from: promoData.validFrom || null,
              valid_until: promoData.validTo || null,
              course_ids: [courseId],
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        } catch (promoErr) {
          console.error("Create promo code failed:", promoErr)
        }
      }

      if (courseId && attachedFiles.length > 0) {
        await Promise.allSettled(
          attachedFiles.map((f) =>
            fetch("/api/admin/course-materials/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
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

      // Create lessons + sub-lessons after course is created
      if (courseId && lessons.length > 0) {
        for (let i = 0; i < lessons.length; i++) {
          try {
            const lesson = lessons[i]
            // Upload sub-lesson videos to Cloudinary first
            const subPayload = []
            for (let j = 0; j < lesson.subLessons.length; j++) {
              const sub = lesson.subLessons[j]
              let vdoUrl = null
              if (sub.videoData?.file) {
                vdoUrl = await uploadFileToCloudinary(
                  sub.videoData.file, "video", "course-flow/videos"
                )
              }
              subPayload.push({
                name: sub.name.trim(),
                order_index: j + 1,
                type: "vdo",
                content: vdoUrl,
              })
            }
            // Create lesson + sub-lessons in one transaction
            await axios.post(
              "/api/admin/lessons/create-with-sublessons",
              {
                course_id: courseId,
                lesson_name: lesson.name.trim(),
                sub_lessons: subPayload,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          } catch (lessonErr) {
            console.error(`Create lesson ${i} failed:`, lessonErr)
          }
        }
      }

      // Always redirect to all courses page
      setBannerStatus("success")
      setTimeout(() => router.push("/admin/courses"), 600)
    } catch (error) {
      console.error("Create course failed:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to create course")
      setBannerStatus("error")
      setTimeout(() => setBannerStatus("idle"), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Add Course - Admin Panel</title>
      </Head>
      <SubmitBanner status={bannerStatus} message={bannerStatus === "loading" ? "Creating course... Please do not close this page" : undefined} />
      <div className="flex justify-between items-center mb-8 p-8 bg-white h-[92px] border-b border-slate-200">
        <h1 className="text-2xl font-medium text-slate-800">Add Course</h1>
        <div className="flex gap-4">
          <Button 
            variant="cancel" 
            size="admin"
            onClick={() => router.push('/admin/courses')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="admin"
            onClick={handleCreate}
            disabled={isSubmitting || loading || !token}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="m-8 mb-16">
      {submitError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{submitError}</p>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-300 shadow-sm px-[100px] pt-10 pb-[60px] mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-8">
          <div className="col-span-2">
            <Label className="mb-1 block body2 text-black font-normal">Course name <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="courseName"
              placeholder="Place Holder"
              value={formData.courseName}
              onChange={handleChange}
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
            />
            {errors.courseName && (
              <p className="text-orange-500 text-sm mt-1">{errors.courseName}</p>
            )}
          </div>
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Price <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="price"
              placeholder="Place Holder"
              type="number"
              value={formData.price}
              onChange={handleChange}
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
            />
            {errors.price && (
              <p className="text-orange-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Total learning time <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="totalLearningTime"
              placeholder="Place Holder"
              type="number"
              value={formData.totalLearningTime}
              onChange={handleChange}
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
            />
            {errors.totalLearningTime && (
              <p className="text-orange-500 text-sm mt-1">{errors.totalLearningTime}</p>
            )}
          </div>
        </div>

        <div className="mb-8 p-8 bg-[#F6F8FE] rounded-xl">
          <div className="flex items-center justify-start gap-3">
            <input 
              type="checkbox" 
              id="promo" 
              className="w-5 h-5 text-[#2F5FAC] rounded border-slate-300 focus:ring-[#2F5FAC]"
              checked={hasPromoCode}
              onChange={(e) => setHasPromoCode(e.target.checked)}
            />
            <Label htmlFor="promo" className="font-medium text-gray-800 body2">Promo code</Label>
          </div>
          
          {hasPromoCode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mt-4">
              <div>
                <Label className="mb-1 block body2 text-black font-normal">Set promo code</Label>
                <Input
                  placeholder="NEWYEAR200"
                  value={promoData.code}
                  onChange={(e) => setPromoData((p) => ({ ...p, code: e.target.value }))}
                  className="h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label className="mb-1 block body2 text-black font-normal">Minimum purchase amount (THB)</Label>
                <Input
                  placeholder="0"
                  type="number"
                  value={promoData.minPurchase}
                  onChange={(e) => setPromoData((p) => ({ ...p, minPurchase: e.target.value }))}
                  className="h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-4 block body2 text-black font-normal">Select discount type</Label>
                <RadioGroup
                  value={promoData.discountType}
                  onValueChange={(v) => setPromoData((p) => ({ ...p, discountType: v }))}
                  className="flex flex-col sm:flex-row gap-12"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="thb" id="course-promo-thb" className="w-5 h-5 border-gray-400 text-blue-500 data-[state=checked]:border-blue-500" />
                    <Label htmlFor="course-promo-thb" className="body2 text-black font-normal">Discount (THB)</Label>
                    <Input
                      className="w-32 ml-2 h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                      placeholder="200"
                      type="number"
                      value={promoData.discountAmount}
                      onChange={(e) => setPromoData((p) => ({ ...p, discountAmount: e.target.value }))}
                      disabled={promoData.discountType !== "thb"}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="percent" id="course-promo-percent" className="w-5 h-5 border-gray-400 text-blue-500 data-[state=checked]:border-blue-500" />
                    <Label htmlFor="course-promo-percent" className="body2 text-black font-normal">Discount (%)</Label>
                    <Input
                      className="w-32 ml-2 h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                      placeholder="30"
                      type="number"
                      value={promoData.discountPercent}
                      onChange={(e) => setPromoData((p) => ({ ...p, discountPercent: e.target.value }))}
                      disabled={promoData.discountType !== "percent"}
                    />
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="mb-1 block body2 text-black font-normal">Valid From</Label>
                <Input
                  type="date"
                  value={promoData.validFrom}
                  onChange={(e) => setPromoData((p) => ({ ...p, validFrom: e.target.value }))}
                  className="h-12 border-gray-400 rounded-lg bg-white body2"
                />
              </div>
              <div>
                <Label className="mb-1 block body2 text-black font-normal">Valid To</Label>
                <Input
                  type="date"
                  value={promoData.validTo}
                  onChange={(e) => setPromoData((p) => ({ ...p, validTo: e.target.value }))}
                  className="h-12 border-gray-400 rounded-lg bg-white body2"
                />
              </div>
              <div>
                <Label className="mb-1 block body2 text-black font-normal">Usage Limit</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={promoData.usageLimit}
                  onChange={(e) => setPromoData((p) => ({ ...p, usageLimit: e.target.value }))}
                  className="h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                />
              </div>
              <p className="col-span-2 text-[12px] text-slate-400 -mt-4">
                โค้ดส่วนลดนี้จะถูกล็อคไว้สำหรับ course นี้เท่านั้น
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Course summary <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="courseSummary"
              placeholder="Place Holder"
              value={formData.courseSummary}
              onChange={handleChange}
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
            />
            {errors.courseSummary && (
              <p className="text-orange-500 text-sm mt-1">{errors.courseSummary}</p>
            )}
          </div>
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Course detail <span className="text-[#C82A2A]">*</span></Label>
            <Textarea
              name="courseDetail"
              placeholder="Place Holder"
              value={formData.courseDetail}
              onChange={handleChange}
              className="min-h-[200px] border-gray-400 rounded-lg resize-none body2 p-4 placeholder:text-gray-600"
            />
            {errors.courseDetail && (
              <p className="text-orange-500 text-sm mt-1">{errors.courseDetail}</p>
            )}
          </div>
        </div>

        <div className="space-y-8 mt-10">
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Cover image <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="coverImgUrl"
              placeholder="Cover image URL"
              value={formData.coverImgUrl}
              onChange={handleChange}
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600 mb-2"
            />
            {errors.coverImgUrl && (
              <p className="text-orange-500 text-sm mt-1 mb-2">{errors.coverImgUrl}</p>
            )}
            <p className="text-[13px] text-slate-400 mb-3">Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB</p>
            <ImageUpload
              value={formData.coverImageData}
              onChange={handleImageUpload}
              maxSize={5 * 1024 * 1024}
              className="w-[240px]"
            />
          </div>
          
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Video Trailer <span className="text-[#C82A2A]">*</span></Label>
            
            {/* Video Upload Component */}
            <VideoUpload
              value={formData.videoTrailerData}
              onChange={handleVideoUpload}
              className="mb-3"
            />
            
            {/* Fallback URL input for manual entry */}
            <div className="mt-4">
              <Input
                name="vdoTrailerUrl"
                placeholder="Or enter video trailer URL manually"
                value={formData.vdoTrailerUrl}
                onChange={handleChange}
                className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
              />
              {errors.vdoTrailerUrl && (
                <p className="text-orange-500 text-sm mt-1">{errors.vdoTrailerUrl}</p>
              )}
            </div>
            
            <p className="text-[13px] text-slate-400 mt-2">
              Upload a video file or enter a URL. Supported formats: .mp4, .mov, .avi, .webm. Max file size: 50 MB
            </p>
          </div>

          <div>
            <Label className="mb-1 block body2 text-black font-normal">Attach File (Optional)</Label>
            <AttachFileUpload
              token={token}
              files={attachedFiles}
              onUpload={(file) => setAttachedFiles((prev) => [...prev, file])}
              onRemove={(file) =>
                setAttachedFiles((prev) =>
                  prev.filter((f) => (f.url ?? f.file_url) !== (file.url ?? file.file_url))
                )
              }
              disabled={!token || isSubmitting}
            />
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] font-medium text-slate-800">Lesson</h2>
          <Button
            variant="primary"
            size="admin"
            type="button"
            onClick={handleAddLesson}
          >
            + Add Lesson
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="bg-[#E2E8F0] bg-opacity-30 border border-slate-100 rounded-xl p-20 flex flex-col items-center justify-center text-center text-[#64748B]">
            <p className="text-[16px] leading-relaxed">
              Press + Add Lesson to add lessons<br />
              (Each course requires at least 1 lesson)
            </p>
          </div>
        ) : (
          <DndContext
            sensors={lessonSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleLessonDragEnd}
          >
            <SortableContext
              items={lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {lessons.map((lesson, idx) => (
                  <LessonBlock
                    key={lesson.id}
                    lesson={lesson}
                    index={idx}
                    onChange={handleLessonChange}
                    onDelete={handleRemoveLesson}
                    errors={lessonErrors[lesson.id]}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      </div>
    </AdminLayout>
  )
}
