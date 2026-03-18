import Head from "next/head"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import AdminLayout from "@/shared/layouts/AdminLayout"
import { Button } from "@/shared/ui/button"
import SubmitBanner from "@/shared/components/SubmitBanner"
import Modal from "@/shared/components/modal"
import { useAuth } from "@/features/auth/context/AuthContext"
import SortableList from "@/features/admin-courses/components/SortableList"
import CourseBasicFields from "@/features/admin-courses/components/CourseBasicFields"
import CourseMediaSection from "@/features/admin-courses/components/CourseMediaSection"
import PromoCodeSection from "@/features/admin-courses/components/PromoCodeSection"
import AddSubLessonDialog from "@/features/admin-courses/components/AddSubLessonDialog"
import { useCloudinaryUpload } from "@/features/admin-courses/hooks/useCloudinaryUpload"
import { usePromoCodeSection } from "@/features/admin-courses/hooks/usePromoCodeSection"
import { useSubLessonModals } from "@/features/admin-courses/hooks/useSubLessonModals"

function extractPublicId(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return null
  try {
    const parts = url.split("/")
    const uploadIndex = parts.findIndex((p) => p === "upload")
    if (uploadIndex === -1 || uploadIndex >= parts.length - 1) return null
    const startIndex = /^v\d+$/.test(parts[uploadIndex + 1]) ? uploadIndex + 2 : uploadIndex + 1
    const publicIdWithExt = parts.slice(startIndex).join("/")
    const dotIndex = publicIdWithExt.lastIndexOf(".")
    return dotIndex > 0 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt
  } catch {
    return null
  }
}

export default function EditCourse() {
  const router = useRouter()
  const { id } = router.query
  const { token, loading, logout } = useAuth()

  const [courseData, setCourseData] = useState({
    name: "", price: "", learningTime: "", summary: "", detail: "",
    coverImgUrl: "", coverImageData: null, vdoTrailerUrl: "", videoTrailerData: null,
    lessons: [], materials: [],
  })
  const [promoCodes, setPromoCodes] = useState([])
  const [pageError, setPageError] = useState("")
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [bannerStatus, setBannerStatus] = useState("idle")

  const { uploadFileToCloudinary } = useCloudinaryUpload()

  const {
    hasPromoCode, setHasPromoCode,
    promoData, updatePromo, isAddingPromo, handleAddPromo,
  } = usePromoCodeSection(token, (msg) => setPageError(msg))

  const refreshLessons = async () => {
    if (!id || !token) return
    const res = await axios.get(`/api/admin/lessons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const lessons = res.data.lessons ?? []
    setCourseData((prev) => ({
      ...prev,
      lessons: lessons.map((l) => ({
        id: l.id, name: l.name, order_index: l.order_index, subLessons: l.subLessons || [],
      })),
    }))
  }

  const subLessonModals = useSubLessonModals(token, refreshLessons, (msg) => setPageError(msg))

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
    if (!loading && !token) router.push("/admin/login")
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
          coverImageData: course?.cover_img_url
            ? { secure_url: course.cover_img_url, preview: course.cover_img_url, name: "cover", public_id: extractPublicId(course.cover_img_url) }
            : null,
          vdoTrailerUrl: course?.vdo_trailer_url ?? "",
          videoTrailerData: course?.vdo_trailer_url
            ? { secure_url: course.vdo_trailer_url, preview: course.vdo_trailer_url, name: "trailer", public_id: extractPublicId(course.vdo_trailer_url) }
            : null,
          lessons,
          materials,
        })
      } catch (error) {
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
  }, [id, token, logout, setHasPromoCode])

  const handleCourseFieldChange = (e) => {
    const { name, value } = e.target
    setCourseData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (imageData) => {
    if (!imageData && courseData.coverImageData?.public_id && !courseData.coverImageData?.file) {
      try {
        await axios.delete("/api/upload/delete", {
          data: { public_id: courseData.coverImageData.public_id, resource_type: "image" },
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.error("Cloudinary image delete failed:", err)
      }
    }
    setCourseData((prev) => ({ ...prev, coverImageData: imageData, coverImgUrl: "" }))
  }

  const handleVideoUpload = async (videoData) => {
    if (!videoData && courseData.videoTrailerData?.public_id && !courseData.videoTrailerData?.file) {
      try {
        await axios.delete("/api/upload/delete", {
          data: { public_id: courseData.videoTrailerData.public_id, resource_type: "video" },
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.error("Cloudinary video delete failed:", err)
      }
    }
    setCourseData((prev) => ({ ...prev, videoTrailerData: videoData, vdoTrailerUrl: "" }))
  }

  const handleUpdateCourse = async () => {
    if (!id || !token) return
    setPageError("")
    setIsSaving(true)
    setBannerStatus("loading")
    try {
      let coverUrl = courseData.coverImageData?.secure_url || courseData.coverImgUrl
      let videoUrl = courseData.videoTrailerData?.secure_url || courseData.vdoTrailerUrl
      if (courseData.coverImageData?.file) {
        coverUrl = await uploadFileToCloudinary(courseData.coverImageData.file, "image", "course-flow/images")
      }
      if (courseData.videoTrailerData?.file) {
        videoUrl = await uploadFileToCloudinary(courseData.videoTrailerData.file, "video", "course-flow/videos")
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
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBannerStatus("success")
      setTimeout(() => setBannerStatus("idle"), 2500)
    } catch (error) {
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

  const handleConfirmDelete = async () => {
    setIsDeleteOpen(false)
    setIsDeleting(true)
    setBannerStatus("loading")
    try {
      const res = await fetch("/api/admin/courses/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Delete failed")
      setBannerStatus("success")
      setTimeout(() => router.push("/admin/courses"), 600)
    } catch (err) {
      setPageError(err.message || "Failed to delete course")
      setBannerStatus("error")
      setTimeout(() => setBannerStatus("idle"), 3000)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return
    try {
      await axios.post("/api/admin/lessons/delete", { lesson_id: lessonId }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await refreshLessons()
    } catch (error) {
      setPageError(error.response?.data?.message || "Failed to delete lesson")
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Edit Course - Admin Panel</title>
      </Head>
      <SubmitBanner
        status={bannerStatus}
        message={bannerStatus === "loading" ? "Saving course... Please do not close this page" : undefined}
      />

      <header className="flex justify-between items-center mb-8 p-8 bg-white h-[92px] border-b border-gray-400 shrink-0">
        <h1 className="text-2xl font-medium text-black flex items-center gap-2">
          <span
            className="text-gray-600 cursor-pointer hover:text-gray-800"
            onClick={() => router.push("/admin/courses")}
          >
            &larr;
          </span>
          Course &apos;{courseData.name}&apos;
        </h1>
        <div className="flex gap-4">
          <Button variant="cancel" size="admin" onClick={() => router.push("/admin/courses")}>
            Cancel
          </Button>
          <Button variant="primary" size="admin" onClick={handleUpdateCourse} disabled={isSaving}>
            {isSaving ? "Saving..." : "Edit"}
          </Button>
        </div>
      </header>

      <div className="m-8 mb-16">
        {pageError && (
          <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
            <p className="text-orange-500 text-sm">{pageError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm px-[100px] pt-10 pb-[60px] mb-8">
          <CourseBasicFields
            formData={courseData}
            onChange={handleCourseFieldChange}
            isAdd={false}
          />

          <PromoCodeSection
            hasPromoCode={hasPromoCode}
            promoData={promoData}
            onToggle={setHasPromoCode}
            onFieldChange={updatePromo}
            existingCodes={promoCodes}
            isAddingPromo={isAddingPromo}
            onAddPromo={() => handleAddPromo(id, (codes) => {
              setPromoCodes(codes)
              setHasPromoCode(true)
            })}
          />

          <CourseMediaSection
            coverImgUrl={courseData.coverImgUrl}
            coverImageData={courseData.coverImageData}
            vdoTrailerUrl={courseData.vdoTrailerUrl}
            videoTrailerData={courseData.videoTrailerData}
            files={courseData.materials}
            token={token}
            disabled={!token || isPageLoading}
            onCoverUrlChange={(e) => setCourseData((prev) => ({ ...prev, coverImgUrl: e.target.value }))}
            onImageUpload={handleImageUpload}
            onVideoUrlChange={(e) => setCourseData((prev) => ({ ...prev, vdoTrailerUrl: e.target.value }))}
            onVideoUpload={handleVideoUpload}
            onFileUpload={async (file) => {
              try {
                const res = await fetch("/api/admin/course-materials/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
            onFileRemove={async (material) => {
              try {
                const res = await fetch("/api/admin/course-materials/delete", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ id: material.id }),
                })
                if (!res.ok) throw new Error("Delete failed")
                setMaterials((prev) => prev.filter((m) => m.id !== material.id))
              } catch (err) {
                console.error("Delete material error:", err)
              }
            }}
          />
        </div>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[22px] font-medium text-slate-800">Lesson</h2>
            <Button
              variant="primary"
              size="admin"
              onClick={() => router.push(`/admin/courses/${id}/lessons/add`)}
              disabled={isPageLoading || !token || !id}
            >
              + Add Lesson
            </Button>
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-200">
            <div className="flex bg-[#E4E6ED] h-[41px]">
              <div className="w-[56px] flex-shrink-0" />
              <div className="w-[48px] flex-shrink-0" />
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

            {isPageLoading ? (
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
                onAddSubLesson={subLessonModals.openAdd}
                onDeleteSubLesson={subLessonModals.handleDelete}
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
        </section>
      </div>

      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        message="Are you sure you want to delete this course?"
        primaryLabel="No, keep it"
        secondaryLabel="Yes, I want to delete this course"
        onSecondaryClick={handleConfirmDelete}
      />

      <AddSubLessonDialog
        isOpen={subLessonModals.isAddOpen}
        name={subLessonModals.newName}
        vdoUrl={subLessonModals.newVdoUrl}
        vdoTime={subLessonModals.newVdoTime}
        isSaving={subLessonModals.isSaving}
        onNameChange={subLessonModals.setNewName}
        onVdoUrlChange={subLessonModals.setNewVdoUrl}
        onVdoTimeChange={subLessonModals.setNewVdoTime}
        onCancel={subLessonModals.closeAdd}
        onConfirm={subLessonModals.handleAdd}
      />
    </AdminLayout>
  )
}
