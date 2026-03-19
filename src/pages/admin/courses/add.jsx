import Head from "next/head"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/shared/layouts/AdminLayout"
import { Button } from "@/shared/ui/button"
import SubmitBanner from "@/shared/components/SubmitBanner"
import LessonBlock from "@/features/admin-lesson/components/LessonBlock"
import { useAuth } from "@/features/auth/context/AuthContext"
import { useAddCourse } from "@/features/admin-courses/hooks/useAddCourse"
import { usePromoCodeSection } from "@/features/admin-courses/hooks/usePromoCodeSection"
import CourseBasicFields from "@/features/admin-courses/components/CourseBasicFields"
import CourseMediaSection from "@/features/admin-courses/components/CourseMediaSection"
import PromoCodeSection from "@/features/admin-courses/components/PromoCodeSection"
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
let subIdCounter = 1
const makeLessonId = () => `lesson-${lessonIdCounter++}`
const makeSubId = () => `sub-${subIdCounter++}`

export default function AddCourse() {
  const router = useRouter()
  const { token, loading, logout } = useAuth()

  const [attachedFiles, setAttachedFiles] = useState([])
  const [lessons, setLessons] = useState([])
  const [lessonErrors] = useState({})

  const {
    formData, errors, submitError, isSubmitting, bannerStatus,
    handleChange, handleImageUpload, handleVideoUpload, handleCreate,
  } = useAddCourse(
    token,
    () => setTimeout(() => router.push("/admin/courses"), 600),
    () => logout()
  )

  const {
    hasPromoCode, setHasPromoCode,
    promoData, updatePromo, getPromoPayload,
  } = usePromoCodeSection(token)

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

  useEffect(() => {
    if (!loading && !token) router.push("/admin/login")
  }, [loading, token, router])

  const handleAddLesson = () => {
    setLessons((prev) => [
      ...prev,
      { id: makeLessonId(), name: "", subLessons: [{ id: makeSubId(), name: "", content_type: "video", content: null, videoData: null }] },
    ])
  }

  return (
    <AdminLayout>
      <Head>
        <title>Add Course - Admin Panel</title>
      </Head>
      <SubmitBanner
        status={bannerStatus}
        message={bannerStatus === "loading" ? "Creating course... Please do not close this page" : undefined}
      />

      <header className="flex justify-between items-center mb-8 p-8 bg-white h-[92px] border-b border-slate-200">
        <h1 className="text-2xl font-medium text-slate-800">Add Course</h1>
        <div className="flex gap-4">
          <Button variant="cancel" size="admin" onClick={() => router.push("/admin/courses")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="admin"
            onClick={() => handleCreate(getPromoPayload(), attachedFiles, lessons)}
            disabled={isSubmitting || loading || !token}
          >
            Create
          </Button>
        </div>
      </header>

      <div className="m-8 mb-16">
        {submitError && (
          <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
            <p className="text-orange-500 text-sm">{submitError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm px-[100px] pt-10 pb-[60px] mb-8">
          <CourseBasicFields
            formData={formData}
            errors={errors}
            onChange={handleChange}
            isAdd={true}
          />

          <PromoCodeSection
            hasPromoCode={hasPromoCode}
            promoData={promoData}
            onToggle={setHasPromoCode}
            onFieldChange={updatePromo}
          />

          <CourseMediaSection
            coverImgUrl={formData.coverImgUrl}
            coverImageData={formData.coverImageData}
            vdoTrailerUrl={formData.vdoTrailerUrl}
            videoTrailerData={formData.videoTrailerData}
            files={attachedFiles}
            token={token}
            errors={errors}
            disabled={!token || isSubmitting}
            onCoverUrlChange={handleChange}
            onImageUpload={handleImageUpload}
            onVideoUrlChange={handleChange}
            onVideoUpload={handleVideoUpload}
            onFileUpload={(file) => setAttachedFiles((prev) => [...prev, file])}
            onFileRemove={(file) =>
              setAttachedFiles((prev) =>
                prev.filter((f) => (f.url ?? f.file_url) !== (file.url ?? file.file_url))
              )
            }
          />
        </div>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[22px] font-medium text-slate-800">Lesson</h2>
            <Button variant="primary" size="admin" type="button" onClick={handleAddLesson}>
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
              <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {lessons.map((lesson, idx) => (
                    <LessonBlock
                      key={lesson.id}
                      lesson={lesson}
                      index={idx}
                      onChange={(updated) =>
                        setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
                      }
                      onDelete={(lessonId) =>
                        setLessons((prev) => prev.filter((l) => l.id !== lessonId))
                      }
                      errors={lessonErrors[lesson.id]}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
