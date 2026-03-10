import Head from "next/head"
import { useEffect, useState } from "react"
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
  const [attachedFiles, setAttachedFiles] = useState([])

  useEffect(() => {
    if (!loading && !token) {
      router.push("/admin/login")
    }
  }, [loading, token, router])

  const handleVideoUpload = (videoData) => {
    setFormData(prev => ({ 
      ...prev, 
      videoTrailerData: videoData,
      vdoTrailerUrl: videoData?.secure_url || "" 
    }))
    if (errors.vdoTrailerUrl) {
      setErrors(prev => ({ ...prev, vdoTrailerUrl: "" }))
    }
  }

  const handleImageUpload = (imageData) => {
    setFormData(prev => ({ 
      ...prev, 
      coverImageData: imageData,
      coverImgUrl: imageData?.secure_url || "" 
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
    if (!formData.coverImgUrl) newErrors.coverImgUrl = "Cover image URL is required"
    if (!formData.videoTrailerData && !formData.vdoTrailerUrl) newErrors.vdoTrailerUrl = "Video trailer is required"
    return newErrors
  }

  const handleCreate = async () => {
    setSubmitError("")

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await axios.post(
        "/api/admin/courses/create",
        {
          course_name: formData.courseName,
          price: Number(formData.price),
          total_learning_time: Number(formData.totalLearningTime),
          course_summary: formData.courseSummary,
          course_detail: formData.courseDetail,
          cover_img_url: formData.coverImgUrl,
          vdo_trailer_url: formData.videoTrailerData?.secure_url || formData.vdoTrailerUrl,
          video_trailer_cloudinary_id: formData.videoTrailerData?.public_id || null,
          video_trailer_duration: formData.videoTrailerData?.duration || null,
          video_trailer_format: formData.videoTrailerData?.format || null,
          video_trailer_size: formData.videoTrailerData?.size || null,
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

      if (courseId) {
        router.push(`/admin/courses/${courseId}`)
      } else {
        router.push("/admin/courses")
      }
    } catch (error) {
      console.error("Create course failed:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to create course")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Add Course - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800">Add Course</h1>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] h-11 px-8 rounded-md font-medium text-[15px]" 
            onClick={() => router.push('/admin/courses')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSubmitting || loading || !token}
            className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px] disabled:opacity-50"
          >
            Create
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{submitError}</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
          <div className="col-span-2">
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course name <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="courseName"
              placeholder="Place Holder"
              value={formData.courseName}
              onChange={handleChange}
              className="h-12 border-slate-300 text-[15px]"
            />
            {errors.courseName && (
              <p className="text-orange-500 text-sm mt-1">{errors.courseName}</p>
            )}
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Price <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="price"
              placeholder="Place Holder"
              type="number"
              value={formData.price}
              onChange={handleChange}
              className="h-12 border-slate-300 text-[15px]"
            />
            {errors.price && (
              <p className="text-orange-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Total learning time <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="totalLearningTime"
              placeholder="Place Holder"
              type="number"
              value={formData.totalLearningTime}
              onChange={handleChange}
              className="h-12 border-slate-300 text-[15px]"
            />
            {errors.totalLearningTime && (
              <p className="text-orange-500 text-sm mt-1">{errors.totalLearningTime}</p>
            )}
          </div>
        </div>

        <div className="mb-10 p-8 bg-[#F6F8FE] rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <input 
              type="checkbox" 
              id="promo" 
              className="w-5 h-5 text-[#2F5FAC] rounded border-slate-300 focus:ring-[#2F5FAC]"
              checked={hasPromoCode}
              onChange={(e) => setHasPromoCode(e.target.checked)}
            />
            <Label htmlFor="promo" className="font-medium text-slate-800 text-[16px]">Promo code</Label>
          </div>
          
          {hasPromoCode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mt-4">
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Set promo code</Label>
                <Input
                  placeholder="NEWYEAR200"
                  value={promoData.code}
                  onChange={(e) => setPromoData((p) => ({ ...p, code: e.target.value }))}
                  className="h-12 border-slate-300 bg-white text-[15px]"
                />
              </div>
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Minimum purchase amount (THB)</Label>
                <Input
                  placeholder="0"
                  type="number"
                  value={promoData.minPurchase}
                  onChange={(e) => setPromoData((p) => ({ ...p, minPurchase: e.target.value }))}
                  className="h-12 border-slate-300 bg-white text-[15px]"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-4 block text-slate-700 font-medium text-[15px]">Select discount type</Label>
                <RadioGroup
                  value={promoData.discountType}
                  onValueChange={(v) => setPromoData((p) => ({ ...p, discountType: v }))}
                  className="flex flex-col sm:flex-row gap-12"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="thb" id="course-promo-thb" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                    <Label htmlFor="course-promo-thb" className="text-slate-700 font-medium text-[15px]">Discount (THB)</Label>
                    <Input
                      className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]"
                      placeholder="200"
                      type="number"
                      value={promoData.discountAmount}
                      onChange={(e) => setPromoData((p) => ({ ...p, discountAmount: e.target.value }))}
                      disabled={promoData.discountType !== "thb"}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="percent" id="course-promo-percent" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                    <Label htmlFor="course-promo-percent" className="text-slate-700 font-medium text-[15px]">Discount (%)</Label>
                    <Input
                      className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]"
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
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Valid From</Label>
                <Input
                  type="date"
                  value={promoData.validFrom}
                  onChange={(e) => setPromoData((p) => ({ ...p, validFrom: e.target.value }))}
                  className="h-12 border-slate-300 bg-white text-[15px]"
                />
              </div>
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Valid To</Label>
                <Input
                  type="date"
                  value={promoData.validTo}
                  onChange={(e) => setPromoData((p) => ({ ...p, validTo: e.target.value }))}
                  className="h-12 border-slate-300 bg-white text-[15px]"
                />
              </div>
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Usage Limit</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={promoData.usageLimit}
                  onChange={(e) => setPromoData((p) => ({ ...p, usageLimit: e.target.value }))}
                  className="h-12 border-slate-300 bg-white text-[15px]"
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
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course summary <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="courseSummary"
              placeholder="Place Holder"
              value={formData.courseSummary}
              onChange={handleChange}
              className="h-12 border-slate-300 text-[15px]"
            />
            {errors.courseSummary && (
              <p className="text-orange-500 text-sm mt-1">{errors.courseSummary}</p>
            )}
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course detail <span className="text-[#C82A2A]">*</span></Label>
            <Textarea
              name="courseDetail"
              placeholder="Place Holder"
              value={formData.courseDetail}
              onChange={handleChange}
              className="min-h-[200px] border-slate-300 resize-none text-[15px] p-4"
            />
            {errors.courseDetail && (
              <p className="text-orange-500 text-sm mt-1">{errors.courseDetail}</p>
            )}
          </div>
        </div>

        <div className="space-y-8 mt-10">
          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Cover image <span className="text-[#C82A2A]">*</span></Label>
            <Input
              name="coverImgUrl"
              placeholder="Cover image URL"
              value={formData.coverImgUrl}
              onChange={handleChange}
              className="h-12 border-slate-300 text-[15px] mb-2"
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
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Video Trailer <span className="text-[#C82A2A]">*</span></Label>
            
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
                className="h-12 border-slate-300 text-[15px]"
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
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Attach File (Optional)</Label>
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
          <Button className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-12 px-6 rounded-md font-medium shadow-sm text-[15px]">
            + Add Lesson
          </Button>
        </div>
        
        <div className="bg-[#E2E8F0] bg-opacity-30 border border-slate-100 rounded-xl p-20 flex flex-col items-center justify-center text-center text-[#64748B]">
          <p className="text-[16px] leading-relaxed">
            เมื่อสร้าง course แล้ว<br />เลื่อนลงมาด้านล่างจะมี lesson ให้สร้างบทเรียนเพิ่มได้<br />
            (ใน 1 คอร์สต้องมีอย่างน้อย 1 บทเรียน)
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
