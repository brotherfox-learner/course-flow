import Head from "next/head"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/common/modal"
import SubmitBanner from "@/common/SubmitBanner"
import SubLessonCard from "@/features/admin-lesson/component/SubLessonCard"
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

let nextTempId = 1
function makeTempId() {
  return `temp-${nextTempId++}`
}

function makeEmptySubLesson() {
  return {
    id: makeTempId(),
    name: "",
    videoData: null,
  }
}

export default function AddLessonPage() {
  const router = useRouter()
  const { id: courseId } = router.query
  const { token, loading, logout } = useAuth()

  const [courseName, setCourseName] = useState("")
  const [lessonName, setLessonName] = useState("")
  const [subLessons, setSubLessons] = useState([makeEmptySubLesson()])
  const [errors, setErrors] = useState({})
  const [pageError, setPageError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bannerStatus, setBannerStatus] = useState("idle")

  const [deleteTarget, setDeleteTarget] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    if (!loading && !token) {
      router.push("/admin/login")
    }
  }, [loading, token, router])

  // Fetch course name for breadcrumb
  useEffect(() => {
    if (!courseId || !token) return
    axios
      .get(`/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCourseName(res.data.course?.course_name ?? "")
      })
      .catch(() => {})
  }, [courseId, token])

  const handleSubLessonChange = useCallback((updated) => {
    setSubLessons((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    )
  }, [])

  const handleAddSubLesson = () => {
    setSubLessons((prev) => [...prev, makeEmptySubLesson()])
  }

  const confirmDeleteSubLesson = (subId) => {
    // ต้องมีอย่างน้อย 1 sub-lesson
    if (subLessons.length <= 1) return
    setDeleteTarget(subId)
  }

  const executeDeleteSubLesson = () => {
    if (!deleteTarget) return
    setSubLessons((prev) => prev.filter((s) => s.id !== deleteTarget))
    setDeleteTarget(null)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = subLessons.findIndex((s) => s.id === active.id)
    const newIndex = subLessons.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    setSubLessons(arrayMove(subLessons, oldIndex, newIndex))
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

  const validate = () => {
    const newErrors = {}
    if (!lessonName.trim()) newErrors.lessonName = "Lesson name is required"

    const subErrors = []
    subLessons.forEach((sub, i) => {
      const e = {}
      if (!sub.name.trim()) e.name = "Sub-lesson name is required"
      if (!sub.videoData && !sub.vdo_url) e.video = "Video is required"
      if (Object.keys(e).length > 0) subErrors[i] = e
    })
    if (subErrors.some(Boolean)) newErrors.subLessons = subErrors

    return newErrors
  }

  const handleCreate = async () => {
    setPageError("")
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setIsSubmitting(true)
    setBannerStatus("loading")

    try {
      // 1) Upload all new sub-lesson videos to Cloudinary
      const subLessonPayload = []
      for (let i = 0; i < subLessons.length; i++) {
        const sub = subLessons[i]
        let vdoUrl = sub.vdo_url || null

        if (sub.videoData?.file) {
          vdoUrl = await uploadFileToCloudinary(
            sub.videoData.file,
            "video",
            "course-flow/videos"
          )
        }

        subLessonPayload.push({
          name: sub.name.trim(),
          order_index: i + 1,
          type: "vdo",
          content: vdoUrl,
        })
      }

      // 2) Create lesson + sub-lessons in one transaction
      await axios.post(
        "/api/admin/lessons/create-with-sublessons",
        {
          course_id: Number(courseId),
          lesson_name: lessonName.trim(),
          sub_lessons: subLessonPayload,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // 3) Navigate back to course edit page
      setBannerStatus("success")
      setTimeout(() => router.push(`/admin/courses/${courseId}`), 600)
    } catch (error) {
      console.error("Create lesson failed:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setPageError(
        error.response?.data?.message || "Failed to create lesson"
      )
      setBannerStatus("error")
      setTimeout(() => setBannerStatus("idle"), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <AdminLayout>
      <Head>
        <title>Add Lesson - Admin Panel</title>
      </Head>
      <SubmitBanner status={bannerStatus} message={bannerStatus === "loading" ? "กำลังสร้างบทเรียน… กรุณาอย่าปิดหน้านี้" : undefined} />

      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-8 bg-white min-h-[92px] border-b border-slate-200">
        <div>
          <p className="text-sm text-slate-400 mb-1">
            Course &apos;{courseName}&apos;
          </p>
          <h1 className="text-2xl font-medium text-slate-800 flex items-center gap-2">
            <span
              className="text-slate-400 cursor-pointer hover:text-slate-600"
              onClick={() => router.push(`/admin/courses/${courseId}`)}
            >
              &larr;
            </span>
            Add Lesson
          </h1>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] h-11 px-8 rounded-md font-medium text-[15px]"
            onClick={() => router.push(`/admin/courses/${courseId}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px] disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <div className="m-8 mb-16">
      {pageError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{pageError}</p>
        </div>
      )}

      {/* Main form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
        {/* Lesson name */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lesson name <span className="text-[#C82A2A]">*</span>
          </label>
          <Input
            value={lessonName}
            onChange={(e) => {
              setLessonName(e.target.value)
              if (errors.lessonName) setErrors((p) => ({ ...p, lessonName: "" }))
            }}
            placeholder="Enter lesson name"
            className="h-12 border-slate-300 text-[15px]"
            disabled={isSubmitting}
          />
          {errors.lessonName && (
            <p className="text-orange-500 text-sm mt-1">{errors.lessonName}</p>
          )}
        </div>

        <hr className="border-slate-200 mb-8" />

        {/* Sub-Lesson section */}
        <h2 className="text-lg font-medium text-slate-800 mb-4">Sub-Lesson</h2>
        <p className="text-xs text-slate-400 mb-6">
          สามารถเพิ่มบทเรียนย่อยได้ไม่จำกัด โดยอย่างน้อยต้องมี 1 ข้อ
          (ไม่สามารถลดได้น้อยกว่า 1 ข้อ)
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subLessons.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {subLessons.map((sub, idx) => (
                <div key={sub.id}>
                  <SubLessonCard
                    subLesson={sub}
                    index={idx}
                    onChange={handleSubLessonChange}
                    onDelete={confirmDeleteSubLesson}
                    disableDelete={subLessons.length <= 1}
                    disabled={isSubmitting}
                  />
                  {errors.subLessons?.[idx]?.name && (
                    <p className="text-orange-500 text-xs mt-1 ml-10">
                      {errors.subLessons[idx].name}
                    </p>
                  )}
                  {errors.subLessons?.[idx]?.video && (
                    <p className="text-orange-500 text-xs mt-1 ml-10">
                      {errors.subLessons[idx].video}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* + Add Sub-lesson button */}
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSubLesson}
            disabled={isSubmitting}
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] rounded-full px-6 h-10 text-sm font-medium"
          >
            + Add Sub-lesson
          </Button>
        </div>
      </div>
      </div>

      {/* Delete Sub-Lesson Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmation"
        message="Are you sure you want to delete this sub-lesson?"
        primaryLabel="Cancel"
        secondaryLabel="Delete"
        onPrimaryClick={() => setDeleteTarget(null)}
        onSecondaryClick={executeDeleteSubLesson}
      />
    </AdminLayout>
  )
}
