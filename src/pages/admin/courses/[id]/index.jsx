import Head from "next/head"

import { useState, useEffect } from "react"

import Link from "next/link"

import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Textarea } from "@/components/ui/textarea"

import { Label } from "@/components/ui/label"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AdminLayout from "@/components/layout/AdminLayout"

import Modal from "@/common/modal"

import { useRouter } from "next/router"

import { useAuth } from "@/context/AuthContext"

import SortableList from "@/features/admin-coureses/component/SortableList"

import AttachFileUpload from "@/features/admin-coureses/component/AttachFileUpload"

import VideoUpload from "@/components/upload/VideoUpload"

import ImageUpload from "@/components/upload/ImageUpload"

import SubmitBanner from "@/common/SubmitBanner"



function extractPublicId(url) {

  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null

  try {

    const parts = url.split('/')

    const uploadIndex = parts.findIndex(p => p === 'upload')

    if (uploadIndex === -1 || uploadIndex >= parts.length - 1) return null

    const startIndex = /^v\d+$/.test(parts[uploadIndex + 1]) ? uploadIndex + 2 : uploadIndex + 1

    const publicIdWithExt = parts.slice(startIndex).join('/')

    const dotIndex = publicIdWithExt.lastIndexOf('.')

    return dotIndex > 0 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt

  } catch { return null }

}



export default function EditCourse() {

  const router = useRouter()

  const { id } = router.query

  const { token, loading, logout } = useAuth()

  const [hasPromoCode, setHasPromoCode] = useState(false)

  const [promoCodes, setPromoCodes] = useState([])

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

  const [isAddingPromo, setIsAddingPromo] = useState(false)

  const [pageError, setPageError] = useState("")

  const [isPageLoading, setIsPageLoading] = useState(true)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  const [bannerStatus, setBannerStatus] = useState("idle")

  const [isDeleting, setIsDeleting] = useState(false)



  const handleConfirmDelete = async () => {

    setIsDeleteOpen(false)

    setIsDeleting(true)

    setBannerStatus("loading")

    try {

      const res = await fetch("/api/admin/courses/delete", {

        method: "DELETE",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({ course_id: id }),

      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Delete failed")

      setBannerStatus("success")

      setTimeout(() => router.push("/admin/courses"), 600)

    } catch (err) {

      console.error("Delete course error:", err)

      if (err.message === "Invalid token" || err.message === "Forbidden") {

        await logout()

        return

      }

      setPageError(err.message || "Failed to delete course")

      setBannerStatus("error")

      setTimeout(() => setBannerStatus("idle"), 3000)

    } finally {

      setIsDeleting(false)

    }

  }



  const [isAddSubLessonOpen, setIsAddSubLessonOpen] = useState(false)

  const [activeLessonId, setActiveLessonId] = useState(null)

  const [newSubLessonName, setNewSubLessonName] = useState("")

  const [newSubLessonVdoUrl, setNewSubLessonVdoUrl] = useState("")

  const [newSubLessonVdoTime, setNewSubLessonVdoTime] = useState("")

  const [isSavingSubLesson, setIsSavingSubLesson] = useState(false)



  const [isEditSubLessonOpen, setIsEditSubLessonOpen] = useState(false)

  const [editSubLessonId, setEditSubLessonId] = useState(null)

  const [editSubLessonName, setEditSubLessonName] = useState("")

  const [editSubLessonVdoUrl, setEditSubLessonVdoUrl] = useState("")

  const [editSubLessonVdoTime, setEditSubLessonVdoTime] = useState("")



  const [courseData, setCourseData] = useState({

    name: "",

    price: "",

    learningTime: "",

    summary: "",

    detail: "",

    coverImgUrl: "",

    vdoTrailerUrl: "",

    videoTrailerData: null,

    lessons: [],

    materials: [],

  })



  const isLoading = isPageLoading



  const setLessons = (updater) => {

    setCourseData((prev) => ({

      ...prev,

      lessons: typeof updater === "function" ? updater(prev.lessons) : updater,

    }))

  }



  const setMaterials = (updater) => {

    setCourseData((prev) => ({

      ...prev,

      materials: typeof updater === "function" ? updater(prev.materials) : updater,

    }))

  }



  useEffect(() => {

    if (!loading && !token) {

      router.push("/admin/login")

    }

  }, [loading, token, router])



  useEffect(() => {

    const fetchCourseAndLessons = async () => {

      if (!id || !token) return



      setIsPageLoading(true)

      setPageError("")

      try {

        const headers = { Authorization: `Bearer ${token}` }

        const [courseRes, lessonsRes, materialsRes, promoCodesRes] = await Promise.all([

          axios.get(`/api/admin/courses/${id}`, { headers }),

          axios.get(`/api/admin/lessons/${id}`, { headers }),

          axios.get(`/api/admin/course-materials?course_id=${id}`, { headers }).catch(() => ({ data: { materials: [] } })),

          axios.get(`/api/admin/courses/${id}/promocodes`, { headers }).catch(() => ({ data: { promoCodes: [] } })),

        ])



        const course = courseRes.data.course

        const lessons = lessonsRes.data.lessons ?? []

        const materials = materialsRes.data?.materials ?? []

        const promos = promoCodesRes.data?.promoCodes ?? []

        setPromoCodes(promos)

        setHasPromoCode(promos.length > 0)



        setCourseData({

          name: course?.course_name ?? "",

          price: course?.price != null ? String(course.price) : "",

          learningTime: course?.total_learning_time != null ? String(course.total_learning_time) : "",

          summary: course?.course_summary ?? "",

          detail: course?.course_detail ?? "",

          coverImgUrl: course?.cover_img_url ?? "",

          coverImageData: course?.cover_img_url ? { secure_url: course.cover_img_url, preview: course.cover_img_url, name: "cover", public_id: extractPublicId(course.cover_img_url) } : null,

          vdoTrailerUrl: course?.vdo_trailer_url ?? "",

          videoTrailerData: course?.vdo_trailer_url ? { secure_url: course.vdo_trailer_url, preview: course.vdo_trailer_url, name: "trailer", public_id: extractPublicId(course.vdo_trailer_url) } : null,

          lessons,

          materials,

        })

      } catch (error) {

        console.error("Fetch course/lessons failed:", error)

        if (error.response?.status === 401 || error.response?.status === 403) {

          await logout()

          return

        }

        setPageError("Failed to load course")

      } finally {

        setIsPageLoading(false)

      }

    }



    fetchCourseAndLessons()

  }, [id, token, logout])



  const refreshLessons = async () => {

    if (!id || !token) return

    const lessonsRes = await axios.get(`/api/admin/lessons/${id}`, {

      headers: { Authorization: `Bearer ${token}` },

    })

    const lessons = lessonsRes.data.lessons ?? []

    setCourseData((prev) => ({

      ...prev,

      lessons: lessons.map((l) => ({

        id: l.id,

        name: l.name,

        order_index: l.order_index,

        subLessons: l.subLessons || [],

      })),

    }))

  }



  const openAddSubLesson = (lessonId) => {

    setActiveLessonId(lessonId)

    setNewSubLessonName("")

    setNewSubLessonVdoUrl("")

    setNewSubLessonVdoTime("")

    setIsAddSubLessonOpen(true)

  }



  const openEditSubLesson = (subLesson) => {

    setEditSubLessonId(subLesson.id)

    setEditSubLessonName(subLesson.name || "")

    setEditSubLessonVdoUrl(subLesson.vdo_url || "")

    setEditSubLessonVdoTime(

      subLesson.vdo_time != null ? String(subLesson.vdo_time) : ""

    )

    setIsEditSubLessonOpen(true)

  }



  const handleAddSubLesson = async () => {

    if (!activeLessonId) return

    if (!newSubLessonName.trim()) return



    setIsSavingSubLesson(true)

    setPageError("")

    try {

      await axios.post(

        "/api/admin/sub-lessons/create",

        {

          lesson_id: activeLessonId,

          name: newSubLessonName.trim(),

          vdo_url: newSubLessonVdoUrl || null,

          vdo_time: newSubLessonVdoTime ? Number(newSubLessonVdoTime) : null,

        },

        {

          headers: { Authorization: `Bearer ${token}` },

        }

      )



      setIsAddSubLessonOpen(false)

      setActiveLessonId(null)

      await refreshLessons()

    } catch (error) {

      console.error("Add sub-lesson failed:", error)

      if (error.response?.status === 401 || error.response?.status === 403) {

        await logout()

        return

      }

      setPageError(error.response?.data?.message || "Failed to add sub-lesson")

    } finally {

      setIsSavingSubLesson(false)

    }

  }



  const handleDeleteLesson = async (lessonId) => {

    const ok = window.confirm("Delete this lesson?")

    if (!ok) return



    try {

      await axios.post(

        "/api/admin/lessons/delete",

        { lesson_id: lessonId },

        { headers: { Authorization: `Bearer ${token}` } }

      )

      await refreshLessons()

    } catch (error) {

      console.error("Delete lesson failed:", error)

      setPageError(error.response?.data?.message || "Failed to delete lesson")

    }

  }



  const handleUpdateSubLesson = async () => {

    if (!editSubLessonId || !editSubLessonName.trim()) return

    try {

      await axios.post(

        "/api/admin/sub-lessons/update",

        {

          sub_lesson_id: editSubLessonId,

          name: editSubLessonName.trim(),

          vdo_url: editSubLessonVdoUrl || null,

          vdo_time: editSubLessonVdoTime ? Number(editSubLessonVdoTime) : null,

        },

        {

          headers: { Authorization: `Bearer ${token}` },

        }

      )

      setIsEditSubLessonOpen(false)

      await refreshLessons()

    } catch (error) {

      console.error("Update sub-lesson failed:", error)

      setPageError(error.response?.data?.message || "Failed to update sub-lesson")

    }

  }



  const handleDeleteSubLesson = async (subLessonId) => {

    const ok = window.confirm("Delete this sub-lesson?")

    if (!ok) return



    try {

      await axios.post(

        "/api/admin/sub-lessons/delete",

        { sub_lesson_id: subLessonId },

        { headers: { Authorization: `Bearer ${token}` } }

      )

      await refreshLessons()

    } catch (error) {

      console.error("Delete sub-lesson failed:", error)

      setPageError(

        error.response?.data?.message || "Failed to delete sub-lesson"

      )

    }

  }



  const handleImageUpload = async (imageData) => {

    // When removing (null) — delete from Cloudinary if it's an existing file from DB

    if (!imageData && courseData.coverImageData?.public_id && !courseData.coverImageData?.file) {

      try {

        await axios.delete("/api/upload/delete", {

          data: { public_id: courseData.coverImageData.public_id, resource_type: "image" },

          headers: { Authorization: `Bearer ${token}` },

        })

      } catch (err) { console.error("Cloudinary image delete failed:", err) }

    }

    setCourseData(prev => ({

      ...prev,

      coverImageData: imageData,

      coverImgUrl: "",

    }))

  }



  const handleVideoUpload = async (videoData) => {

    // When removing (null) — delete from Cloudinary if it's an existing file from DB

    if (!videoData && courseData.videoTrailerData?.public_id && !courseData.videoTrailerData?.file) {

      try {

        await axios.delete("/api/upload/delete", {

          data: { public_id: courseData.videoTrailerData.public_id, resource_type: "video" },

          headers: { Authorization: `Bearer ${token}` },

        })

      } catch (err) { console.error("Cloudinary video delete failed:", err) }

    }

    setCourseData(prev => ({

      ...prev,

      videoTrailerData: videoData,

      vdoTrailerUrl: ""

    }))

  }



  // Helper: upload a File to Cloudinary via signature API

  const uploadFileToCloudinary = async (file, resourceType, folder) => {

    const sigRes = await fetch("/api/upload/signature", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ resource_type: resourceType, folder }),

    })

    if (!sigRes.ok) throw new Error("Failed to get upload signature")

    const sig = await sigRes.json()



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



  const handleUpdateCourse = async () => {

    if (!id || !token) return



    setPageError("")

    setIsSaving(true)

    setBannerStatus("loading")

    try {

      // Upload new files to Cloudinary NOW (only on save)

      let coverUrl = courseData.coverImageData?.secure_url || courseData.coverImgUrl

      let videoUrl = courseData.videoTrailerData?.secure_url || courseData.vdoTrailerUrl



      if (courseData.coverImageData?.file) {

        coverUrl = await uploadFileToCloudinary(

          courseData.coverImageData.file, "image", "course-flow/images"

        )

      }

      if (courseData.videoTrailerData?.file) {

        videoUrl = await uploadFileToCloudinary(

          courseData.videoTrailerData.file, "video", "course-flow/videos"

        )

      }



      await axios.post(

        "/api/admin/courses/update",

        {

          course_id: Number(id),

          course_name: courseData.name,

          price: Number(courseData.price),

          total_learning_time: Number(courseData.learningTime),

          course_summary: courseData.summary,

          course_detail: courseData.detail,

          cover_img_url: coverUrl,

          vdo_trailer_url: videoUrl,

        },

        {

          headers: { Authorization: `Bearer ${token}` },

        }

      )



      setBannerStatus("success")

      setTimeout(() => setBannerStatus("idle"), 2500)

    } catch (error) {

      console.error("Update course failed:", error)

      if (error.response?.status === 401 || error.response?.status === 403) {

        await logout()

        return

      }

      setPageError(error.response?.data?.message || "Failed to update course")

      setBannerStatus("error")

      setTimeout(() => setBannerStatus("idle"), 3000)

    } finally {

      setIsSaving(false)

    }

  }



  return (

    <AdminLayout>

      <Head>

        <title>Edit Course - Admin Panel</title>

      </Head>

      <SubmitBanner status={bannerStatus} message={bannerStatus === "loading" ? "Saving course... Please do not close this page" : undefined} />
      <div className="flex justify-between items-center mb-8 p-8 bg-white h-[92px] border-b border-gray-400 shrink-0">
        <h1 className="text-2xl font-medium text-black flex items-center gap-2">
          <span className="text-gray-600 cursor-pointer hover:text-gray-800" onClick={() => router.push('/admin/courses')}>&larr;</span>
          Course &apos;{courseData.name}&apos;

        </h1>

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
            onClick={handleUpdateCourse}

            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Edit"}
          </Button>

        </div>

      </div>



      <div className="m-8 mb-16">

        {pageError && (

          <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">

            <p className="text-orange-500 text-sm">{pageError}</p>

          </div>

        )}

        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm px-[100px] pt-10 pb-[60px] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-8">
            <div className="col-span-2">
              <Label className="mb-1 block body2 text-black font-normal">Course name <span className="text-[#5483D0]">*</span></Label>
              <Input value={courseData.name} onChange={(e) => setCourseData(prev => ({ ...prev, name: e.target.value }))} className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600" />
            </div>

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Price <span className="text-[#5483D0]">*</span></Label>
              <Input value={courseData.price} onChange={(e) => setCourseData(prev => ({ ...prev, price: e.target.value }))} type="number" className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600" />
            </div>

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Total learning time <span className="text-[#5483D0]">*</span></Label>
              <Input value={courseData.learningTime} onChange={(e) => setCourseData(prev => ({ ...prev, learningTime: e.target.value }))} type="number" className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600" />
            </div>

          </div>



          <section className="mb-10 p-8 bg-[#F6F8FE] rounded-xl">

            <div className="flex items-center justify-start gap-3 mb-4">

              <input

                type="checkbox"

                id="promo"
                className="w-5 h-5 rounded border-slate-300 accent-[#2F5FAC] focus:ring-[#2F5FAC]"
                checked={hasPromoCode}

                onChange={(e) => setHasPromoCode(e.target.checked)}

              />
              <Label htmlFor="promo" className="font-medium text-gray-800 body2">Promo code</Label>
            </div>

            {hasPromoCode ? (

              <article>

                {promoCodes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[13px] text-slate-500 mb-4">Promo codes that are associated with this course.</p>
                    <ul className="space-y-2">
                      {promoCodes.map((promo) => (
                        <li key={promo.id}>
                          <Link
                            href={`/admin/promocodes/${promo.id}`}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-[#2F5FAC] hover:bg-slate-50 transition-colors"
                          >
                            <span className="font-medium text-slate-800">{promo.code}</span>
                            <span className={`text-xs px-2 py-1 rounded ${promo.status === "active" ? "bg-green-100 text-green-700" : promo.status === "expired" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}>
                              {promo.status}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[13px] text-slate-500 mb-4">Add promo code for this course</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <div>
                    <Label className="mb-1 block body2 text-black font-normal">Set promo code</Label>
                    <Input
                      placeholder="Enter promo code"
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
                        <RadioGroupItem value="thb" id="course-promo-thb" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
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
                        <RadioGroupItem value="percent" id="course-promo-percent" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
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
                      placeholder="Unlimited"
                      value={promoData.usageLimit}

                      onChange={(e) => setPromoData((p) => ({ ...p, usageLimit: e.target.value }))}
                      className="h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                    />

                  </div>

                </div>
                <p className="text-[13px] text-slate-400 mt-4">This discount code will be locked for this course only</p>
                <Button

                  onClick={async () => {

                    if (!promoData.code.trim()) return

                    if (!promoData.validFrom || !promoData.validTo) {

                      setPageError("Please fill in Valid From and Valid To")

                      return

                    }

                    setIsAddingPromo(true)

                    setPageError("")

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

                          valid_from: promoData.validFrom,

                          valid_until: promoData.validTo,

                          course_ids: [Number(id)],

                        },

                        { headers: { Authorization: `Bearer ${token}` } }

                      )

                      const promocodesRes = await axios.get(`/api/admin/courses/${id}/promocodes`, {

                        headers: { Authorization: `Bearer ${token}` },

                      })

                      setPromoCodes(promocodesRes.data?.promoCodes ?? [])

                      setHasPromoCode(true)

                      setPromoData({

                        code: "",

                        discountType: "percent",

                        discountAmount: "",

                        discountPercent: "",

                        minPurchase: "0",

                        validFrom: "",

                        validTo: "",

                        usageLimit: "",

                      })

                    } catch (err) {

                      console.error("Create promo code failed:", err)

                      setPageError(err.response?.data?.message || "Failed to create promo code")

                    } finally {

                      setIsAddingPromo(false)

                    }

                  }}

                  disabled={isAddingPromo}
                  variant="primary"
                  size="admin"
                  className="mt-4"
                >

                  {isAddingPromo ? "Adding..." : "Add Promo Code"}

                </Button>

              </article>

            ) : null}

          </section>



          <div className="space-y-8">

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Course summary <span className="text-[#5483D0]">*</span></Label>
              <Input value={courseData.summary} onChange={(e) => setCourseData(prev => ({ ...prev, summary: e.target.value }))} className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600" />
            </div>

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Course detail <span className="text-[#5483D0]">*</span></Label>
              <Textarea value={courseData.detail} onChange={(e) => setCourseData(prev => ({ ...prev, detail: e.target.value }))} className="min-h-[300px] border-gray-400 rounded-lg resize-none body2 leading-relaxed p-4 placeholder:text-gray-600" />
            </div>

          </div>



          <div className="space-y-8 mt-10">

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Cover image <span className="text-[#5483D0]">*</span></Label>
              <p className="text-[13px] text-slate-400 mb-3">Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB</p>
              {/* Image Upload Component */}
              {/*Fallback URL input for manual entry */}
              <div className="my-4">
                <Input
                  placeholder="Cover image URL"
                  value={courseData.coverImgUrl}
                  onChange={(e) => setCourseData(prev => ({ ...prev, coverImgUrl: e.target.value }))}
                  className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                />
              </div>
              <ImageUpload

                value={courseData.coverImageData}

                onChange={handleImageUpload}
                className="max-w-[300px] max-h-[300px] min-h-[300px] min-w-[300px]"
                maxSize={5 * 1024 * 1024}

              />

            </div>



            <div>
              <Label className="mb-1 block body2 text-black font-normal">Video Trailer <span className="text-[#5483D0]">*</span></Label>


              {/* Video Upload Component */}

              <div className="my-4">

                <Input

                  placeholder="Video trailer URL"

                  value={courseData.vdoTrailerUrl}

                  onChange={(e) => setCourseData(prev => ({ ...prev, vdoTrailerUrl: e.target.value }))}
                  className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                />

              </div>
              <div className="my-4">
                <VideoUpload

                  value={courseData.videoTrailerData}

                  onChange={handleVideoUpload}

                  className="max-w-[300px] max-h-[300px] min-h-[300px] min-w-[300px]"
                />
              </div>



              {/* Fallback URL input for manual entry */}




              <p className="text-[13px] text-slate-400 mt-2">

                Upload a video file or enter a URL. Supported formats: .mp4, .mov, .avi, .webm. Max file size: 50 MB

              </p>

            </div>



            <div>
              <Label className="mb-1 block body2 text-black font-normal">Attach File (Optional)</Label>
              <AttachFileUpload

                token={token}

                files={courseData.materials}

                onUpload={async (file) => {

                  try {

                    const res = await fetch("/api/admin/course-materials/create", {

                      method: "POST",

                      headers: {

                        "Content-Type": "application/json",

                        Authorization: `Bearer ${token}`,

                      },

                      body: JSON.stringify({

                        course_id: Number(id),

                        file_name: file.fileName,

                        file_url: file.url,

                        file_type: file.fileType,

                        file_size: file.fileSize,

                      }),

                    })

                    if (!res.ok) throw new Error("Failed to save material")

                    const data = await res.json()

                    setMaterials((prev) => [...prev, data.material])

                  } catch (err) {

                    console.error("Save material error:", err)

                  }

                }}

                onRemove={async (material) => {

                  try {

                    const res = await fetch("/api/admin/course-materials/delete", {

                      method: "DELETE",

                      headers: {

                        "Content-Type": "application/json",

                        Authorization: `Bearer ${token}`,

                      },

                      body: JSON.stringify({ id: material.id }),

                    })

                    if (!res.ok) throw new Error("Delete failed")

                    setMaterials((prev) => prev.filter((m) => m.id !== material.id))

                  } catch (err) {

                    console.error("Delete material error:", err)

                  }

                }}

                disabled={!token || isLoading}

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
              onClick={() => router.push(`/admin/courses/${id}/lessons/add`)}
              disabled={isLoading || !token || !id}

            >

              + Add Lesson

            </Button>

          </div>



          <div className="rounded-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex bg-[#E4E6ED] h-[41px]">
              <div className="w-[56px] flex-shrink-0"></div>
              <div className="w-[48px] flex-shrink-0"></div>
              <div className="flex-1 flex items-center px-4">
                <span className="text-sm text-[#424C6B]">Lesson name</span>
              </div>
              <div className="w-[396px] flex-shrink-0 flex items-center px-4">
                <span className="text-sm text-[#424C6B]">Sub-lesson</span>
              </div>
              <div className="w-[120px] flex-shrink-0 flex items-center justify-center">
                <span className="text-sm text-[#424C6B]">Action</span>
              </div>
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-slate-500">
                Loading lessons...
              </div>
            ) : (
              <SortableList
                lessons={courseData.lessons}
                setLessons={setLessons}
                courseId={id}
                token={token}
                onDeleteLesson={handleDeleteLesson}
                onEditLesson={(lesson) => router.push(`/admin/courses/${id}/lessons/${lesson.id}`)}
                onAddSubLesson={openAddSubLesson}
                onDeleteSubLesson={handleDeleteSubLesson}
                onEditSubLesson={openEditSubLesson}
              />
            )}
          </div>

          <div className="flex justify-end mt-4">

            <Button

              variant="ghost"
              className="text-base font-bold text-red-500 hover:text-red-500 hover:bg-red-50 active:text-red-500"
              onClick={() => setIsDeleteOpen(true)}

              disabled={isDeleting || isSaving}

            >

              Delete Course

            </Button>

          </div>

        </div>

      </div >

      <Modal

        open={isDeleteOpen}

        onClose={() => setIsDeleteOpen(false)}

        message="Are you sure you want to delete this course?"

        primaryLabel="No, keep it"

        secondaryLabel={"Yes, I want to delete this course"}

        onSecondaryClick={handleConfirmDelete}

      />



      {/* Add Sub-Lesson Dialog */}

      {
        isAddSubLessonOpen && (

          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">

              <h3 className="text-lg font-medium mb-4">Add Sub-Lesson</h3>

              <div className="space-y-4">

                <div>
                  <Label className="mb-1 block body2 text-black font-normal">Sub-lesson name</Label>
                  <Input

                    value={newSubLessonName}

                    onChange={(e) => setNewSubLessonName(e.target.value)}

                    placeholder="Enter sub-lesson name"
                    className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                  />

                </div>

                <div>
                  <Label className="mb-1 block body2 text-black font-normal">Video URL (Optional)</Label>
                  <Input

                    value={newSubLessonVdoUrl}

                    onChange={(e) => setNewSubLessonVdoUrl(e.target.value)}

                    placeholder="https://..."
                    className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                  />

                </div>

                <div>
                  <Label className="mb-1 block body2 text-black font-normal">Video Duration in minutes (Optional)</Label>
                  <Input

                    type="number"

                    value={newSubLessonVdoTime}

                    onChange={(e) => setNewSubLessonVdoTime(e.target.value)}

                    placeholder="10"
                    className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="cancel" size="admin" onClick={() => setIsAddSubLessonOpen(false)}>Cancel</Button>
                <Button variant="primary" size="admin" onClick={handleAddSubLesson} disabled={isSavingSubLesson}>
                  {isSavingSubLesson ? "Adding..." : "Add"}

                </Button>

              </div>

            </div>

          </div>

        )
      }



      {/* Edit Sub-Lesson Dialog */}

      {
        isEditSubLessonOpen && (

          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">

              <h3 className="text-lg font-medium mb-4">Edit Sub-Lesson</h3>

              <div className="space-y-4">

                <div>
                  <Label className="mb-1 block body2 text-black font-normal">Sub-lesson name</Label>
                  <Input

                    value={editSubLessonName}

                    onChange={(e) => setEditSubLessonName(e.target.value)}

                    placeholder="Sub-lesson name"
                    className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                  />

                </div>

                <div>
                  <Label className="mb-1 block body2 text-black font-normal">Video URL (Optional)</Label>
                  <Input

                    value={editSubLessonVdoUrl}

                    onChange={(e) => setEditSubLessonVdoUrl(e.target.value)}

                    placeholder="https://..."
                    className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                  />

                </div>

                <div>
                  <Label className="mb-1 block body2 text-black font-normal">Video Duration in minutes (Optional)</Label>
                  <Input

                    type="number"

                    value={editSubLessonVdoTime}

                    onChange={(e) => setEditSubLessonVdoTime(e.target.value)}

                    placeholder="10"
                    className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="cancel" size="admin" onClick={() => setIsEditSubLessonOpen(false)}>Cancel</Button>
                <Button variant="primary" size="admin" onClick={handleUpdateSubLesson}>Save</Button>
              </div>

            </div>

          </div>

        )
      }

    </AdminLayout >

  )

}

