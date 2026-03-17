import Head from "next/head"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import { useAuth } from "@/features/auth/context/AuthContext"
import AdminLayout from "@/shared/layouts/AdminLayout"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import Modal from "@/shared/components/modal"
import SubmitBanner from "@/shared/components/SubmitBanner"
import SubLessonCard from "@/features/admin-lesson/components/SubLessonCard"
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

function extractPublicId(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com"))
    return null
  try {
    const parts = url.split("/")
    const uploadIndex = parts.findIndex((p) => p === "upload")
    if (uploadIndex === -1 || uploadIndex >= parts.length - 1) return null
    const startIndex = /^v\d+$/.test(parts[uploadIndex + 1])
      ? uploadIndex + 2
      : uploadIndex + 1
    const publicIdWithExt = parts.slice(startIndex).join("/")
    const dotIndex = publicIdWithExt.lastIndexOf(".")
    return dotIndex > 0
      ? publicIdWithExt.substring(0, dotIndex)
      : publicIdWithExt
  } catch {
    return null
  }
}

export default function EditLessonPage() {
  const router = useRouter()
  const { id: courseId, lessonId } = router.query
  const { token, loading, logout } = useAuth()

  const [courseName, setCourseName] = useState("")
  const [lessonName, setLessonName] = useState("")
  const [originalLessonName, setOriginalLessonName] = useState("")
  const [subLessons, setSubLessons] = useState([])
  const [errors, setErrors] = useState({})
  const [pageError, setPageError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [bannerStatus, setBannerStatus] = useState("idle")

  const [deleteSubTarget, setDeleteSubTarget] = useState(null)
  const [isDeleteLessonOpen, setIsDeleteLessonOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    if (!loading && !token) {
      router.push("/admin/login")
    }
  }, [loading, token, router])

  // Fetch course name + lesson data
  useEffect(() => {
    if (!courseId || !lessonId || !token) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const headers = { Authorization: `Bearer ${token}` }

        const [courseRes, lessonsRes] = await Promise.all([
          axios.get(`/api/admin/courses/${courseId}`, { headers }),
          axios.get(`/api/admin/lessons/${courseId}`, { headers }),
        ])

        setCourseName(courseRes.data.course?.course_name ?? "")

        const allLessons = lessonsRes.data.lessons ?? []
        const lesson = allLessons.find((l) => String(l.id) === String(lessonId))

        if (!lesson) {
          setPageError("Lesson not found")
          return
        }

        setLessonName(lesson.name)
        setOriginalLessonName(lesson.name)

        const mappedSubs = (lesson.sub_lessons || [])
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((sub) => ({
            id: sub.id,
            dbId: sub.id,
            name: sub.name || "",
            vdo_url: sub.vdo_url || null,
            videoData: sub.vdo_url
              ? {
                  secure_url: sub.vdo_url,
                  preview: sub.vdo_url,
                  name: "video",
                  public_id: extractPublicId(sub.vdo_url),
                }
              : null,
          }))

        setSubLessons(
          mappedSubs.length > 0
            ? mappedSubs
            : [{ id: makeTempId(), name: "", videoData: null }]
        )
      } catch (error) {
        console.error("Fetch lesson failed:", error)
        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          await logout()
          return
        }
        setPageError("Failed to load lesson data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId, lessonId, token, logout])

  const handleSubLessonChange = useCallback((updated) => {
    setSubLessons((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    )
  }, [])

  const handleAddSubLesson = () => {
    setSubLessons((prev) => [
      ...prev,
      { id: makeTempId(), name: "", videoData: null },
    ])
  }

  const confirmDeleteSubLesson = (subId) => {
    if (subLessons.length <= 1) return
    setDeleteSubTarget(subId)
  }

  const executeDeleteSubLesson = async () => {
    if (!deleteSubTarget) return

    const sub = subLessons.find((s) => s.id === deleteSubTarget)

    // If it's a persisted sub-lesson, delete from DB
    if (sub?.dbId) {
      try {
        await axios.post(
          "/api/admin/sub-lessons/delete",
          { sub_lesson_id: sub.dbId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (err) {
        console.error("Delete sub-lesson failed:", err)
        setPageError("Failed to delete sub-lesson")
        setDeleteSubTarget(null)
        return
      }
    }

    setSubLessons((prev) => prev.filter((s) => s.id !== deleteSubTarget))
    setDeleteSubTarget(null)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = subLessons.findIndex((s) => s.id === active.id)
    const newIndex = subLessons.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(subLessons, oldIndex, newIndex)
    setSubLessons(reordered)

    // Persist reorder for existing sub-lessons
    const persistedSubs = reordered
      .map((s, i) => (s.dbId ? { id: s.dbId, order_index: i + 1 } : null))
      .filter(Boolean)

    if (persistedSubs.length > 0) {
      try {
        await axios.post(
          "/api/admin/sub-lessons/reorder",
          {
            lesson_id: Number(lessonId),
            sub_lesson_orders: persistedSubs,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (err) {
        console.error("Reorder sub-lessons failed:", err)
      }
    }
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

  const handleSave = async () => {
    setPageError("")
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setIsSaving(true)
    setBannerStatus("loading")

    try {
      // 1) Update lesson name if changed
      if (lessonName.trim() !== originalLessonName) {
        await axios.post(
          "/api/admin/lessons/update",
          { lesson_id: Number(lessonId), name: lessonName.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      // 2) Process each sub-lesson
      for (let i = 0; i < subLessons.length; i++) {
        const sub = subLessons[i]

        // Upload new video if needed
        let vdoUrl = sub.videoData?.secure_url || sub.vdo_url || null
        if (sub.videoData?.file) {
          vdoUrl = await uploadFileToCloudinary(
            sub.videoData.file,
            "video",
            "course-flow/videos"
          )
        }

        if (sub.dbId) {
          // Update existing sub-lesson
          await axios.post(
            "/api/admin/sub-lessons/update",
            {
              sub_lesson_id: sub.dbId,
              name: sub.name.trim(),
              vdo_url: vdoUrl,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        } else {
          // Create new sub-lesson
          await axios.post(
            "/api/admin/sub-lessons/create",
            {
              lesson_id: Number(lessonId),
              name: sub.name.trim(),
              vdo_url: vdoUrl,
              order_index: i + 1,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        }
      }

      // 3) Navigate back
      setBannerStatus("success")
      setTimeout(() => router.push(`/admin/courses/${courseId}`), 600)
    } catch (error) {
      console.error("Save lesson failed:", error)
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        await logout()
        return
      }
      setPageError(error.response?.data?.message || "Failed to save lesson")
      setBannerStatus("error")
      setTimeout(() => setBannerStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLesson = async () => {
    try {
      await axios.post(
        "/api/admin/lessons/delete",
        { lesson_id: Number(lessonId) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      router.push(`/admin/courses/${courseId}`)
    } catch (error) {
      console.error("Delete lesson failed:", error)
      setPageError(error.response?.data?.message || "Failed to delete lesson")
    }
  }

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="p-10 text-slate-500">Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>
          Lesson &apos;{lessonName}&apos; - Admin Panel
        </title>
      </Head>
      <SubmitBanner status={bannerStatus} message={bannerStatus === "loading" ? "Saving lesson... Please do not close this page" : undefined} />

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
            Lesson &apos;{originalLessonName}&apos;
          </h1>
        </div>
        <div className="flex gap-4">
          <Button
            variant="cancel"
            size="admin"
            onClick={() => router.push(`/admin/courses/${courseId}`)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="admin"
            onClick={handleSave}
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

      {/* Main form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-4">
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
            disabled={isSaving}
          />
          {errors.lessonName && (
            <p className="text-orange-500 text-sm mt-1">{errors.lessonName}</p>
          )}
        </div>

        <hr className="border-slate-200 mb-8" />

        {/* Sub-Lesson section */}
        <h2 className="text-lg font-medium text-slate-800 mb-6">Sub-Lesson</h2>

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
                    disabled={isSaving}
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
            disabled={isSaving}
            className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-500 rounded-full px-6 h-10 text-sm font-bold"
          >
            + Add Sub-lesson
          </Button>
        </div>
      </div>

      {/* Delete Lesson link */}
      <div className="flex justify-end mb-12">
        <button
          type="button"
          onClick={() => setIsDeleteLessonOpen(true)}
          className="text-[#2F5FAC] text-sm font-medium hover:text-red-500 transition-colors"
        >
          Delete Lesson
        </button>
      </div>
      </div>

      {/* Delete Sub-Lesson Confirmation Modal */}
      <Modal
        open={!!deleteSubTarget}
        onClose={() => setDeleteSubTarget(null)}
        title="Confirmation"
        message="Are you sure you want to delete this sub-lesson?"
        primaryLabel="Cancel"
        secondaryLabel="Delete"
        onPrimaryClick={() => setDeleteSubTarget(null)}
        onSecondaryClick={executeDeleteSubLesson}
      />

      {/* Delete Lesson Confirmation Modal */}
      <Modal
        open={isDeleteLessonOpen}
        onClose={() => setIsDeleteLessonOpen(false)}
        title="Confirmation"
        message="Are you sure you want to delete this lesson?"
        primaryLabel="Cancel"
        secondaryLabel="Delete"
        onPrimaryClick={() => setIsDeleteLessonOpen(false)}
        onSecondaryClick={handleDeleteLesson}
      />
    </AdminLayout>
  )
}
