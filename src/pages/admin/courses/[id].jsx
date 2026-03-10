import Head from "next/head"
import { useState } from "react"
import Button from "@/common/navbar/Button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import AdminLayout from "@/components/layout/AdminLayout"
import Modal from "@/common/modal"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthContext"
import SortableList from "@/features/admin-coureses/component/SortableList"
import AttachFileUpload from "@/features/admin-coureses/component/AttachFileUpload"
import useCourseEditor from "@/features/admin-coureses/hook/useCourseEditor"
import useDeleteCourse from "@/features/admin-coureses/hook/useDeleteCourse"
import VideoUpload from "@/components/upload/VideoUpload"

export default function EditCourse() {
  const router = useRouter()
  const { id } = router.query
  const { token, loading, logout } = useAuth()
  const [hasPromoCode, setHasPromoCode] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isPageLoading, setIsPageLoading] = useState(true)

  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false)
  const [newLessonName, setNewLessonName] = useState("")
  const [isSavingLesson, setIsSavingLesson] = useState(false)

  const [isAddSubLessonOpen, setIsAddSubLessonOpen] = useState(false)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [newSubLessonName, setNewSubLessonName] = useState("")
  const [newSubLessonVdoUrl, setNewSubLessonVdoUrl] = useState("")
  const [newSubLessonVdoTime, setNewSubLessonVdoTime] = useState("")
  const [isSavingSubLesson, setIsSavingSubLesson] = useState(false)

  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false)
  const [editLessonId, setEditLessonId] = useState(null)
  const [editLessonName, setEditLessonName] = useState("")

  const [isEditSubLessonOpen, setIsEditSubLessonOpen] = useState(false)
  const [editSubLessonId, setEditSubLessonId] = useState(null)
  const [editSubLessonName, setEditSubLessonName] = useState("")
  const [editSubLessonVdoUrl, setEditSubLessonVdoUrl] = useState("")
  const [editSubLessonVdoTime, setEditSubLessonVdoTime] = useState("")

  // Mock data for initial load based on Figma
  const [courseData, setCourseData] = useState({
    name: "Service Design Essentials",
    price: "3559.00",
    learningTime: "6",
    promoCode: "NEWYEAR200",
    promoAmount: "0",
    discountType: "thb",
    discountValue: "200",
    summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    detail: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum aenean fermentum, velit vel, scelerisque morbi accumsan. Nec, tellus leo id leo id felis egestas. Quam sit lorem quis vitae ut mus imperdiet. Volutpat placerat dignissim dolor faucibus elit ornare fringilla. Vivamus amet risus ullamcorper auctor nibh. Maecenas morbi nec vestibulum ac tempus vehicula.\n\nVel, sit magna nisl cras non cursus. Sed sed sit ullamcorper neque. Dictum sapien amet, dictumst maecenas. Mattis nulla tellus ut neque euismod cras amet, volutpat purus. Semper purus viverra turpis in tempus ac nunc. Morbi ullamcorper sed elit enim turpis. Scelerisque rhoncus morbi pulvinar donec at sed fermentum. Duis non urna lacus, sit amet. Accumsan orci elementum nisl tellus sit quis. Integer turpis lectus eu blandit sit. At at cras viverra odio neque nisl consectetur. Arcu senectus aliquet vulputate urna, ornare. Mi sem tellus elementum at commodo blandit nunc. Viverra elit adipiscing ut dui, tellus viverra nec.\n\nLectus pharetra eget curabitur lobortis gravida gravida eget ut. Nullam velit morbi quam a at. Sed eu orci, mollis nulla at sit. Nunc quam integer metus vitae elementum pulvinar mattis nulla molestie. Quis eget vestibulum, faucibus malesuada eu. Et lectus molestie egestas faucibus auctor auctor.",
    coverImgUrl: "",
    vdoTrailerUrl: "",
    videoTrailerData: null,
    lessons: [
      { id: 1, name: "Introduction", subLessons: 10 },
      { id: 2, name: "Service Design Theories and Principles", subLessons: 10 },
      { id: 3, name: "Understanding Users and Finding Opportunities", subLessons: 10 },
      { id: 4, name: "Identifying and Validating Opportunities for Design", subLessons: 10 },
      { id: 5, name: "Prototyping", subLessons: 10 },
      { id: 6, name: "Course Summary", subLessons: 10 },
    ]
  })

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
        const [courseRes, lessonsRes] = await Promise.all([
          axios.get(`/api/admin/courses/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/admin/lessons/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const course = courseRes.data.course
        setCourseData((prev) => ({
          ...prev,
          name: course?.course_name ?? prev.name,
          price: course?.price != null ? String(course.price) : prev.price,
          learningTime:
            course?.total_learning_time != null
              ? String(course.total_learning_time)
              : prev.learningTime,
          summary: course?.course_summary ?? prev.summary,
          detail: course?.course_detail ?? prev.detail,
          coverImgUrl: course?.cover_img_url ?? prev.coverImgUrl,
          vdoTrailerUrl: course?.vdo_trailer_url ?? prev.vdoTrailerUrl,
          videoTrailerData: course?.vdo_trailer_url ? {
            secure_url: course.vdo_trailer_url,
          } : null,
        }))

        const lessons = lessonsRes.data.lessons ?? []
        setCourseData((prev) => ({
          ...prev,
          lessons: lessons.map((l) => ({
            id: l.id,
            name: l.name,
            order_index: l.order_index,
            subLessons: (l.sub_lessons || []).length,
            sub_lessons: l.sub_lessons || [],
          })),
        }))
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
        subLessons: (l.sub_lessons || []).length,
        sub_lessons: l.sub_lessons || [],
      })),
    }))
  }

  const handleAddLesson = async () => {
    if (!newLessonName.trim()) return

    setIsSavingLesson(true)
    setPageError("")
    try {
      await axios.post(
        "/api/admin/lessons/create",
        {
          course_id: Number(id),
          name: newLessonName.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setNewLessonName("")
      setIsAddLessonOpen(false)
      await refreshLessons()
    } catch (error) {
      console.error("Add lesson failed:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setPageError(error.response?.data?.message || "Failed to add lesson")
    } finally {
      setIsSavingLesson(false)
    }
  }

  const openAddSubLesson = (lessonId) => {
    setActiveLessonId(lessonId)
    setNewSubLessonName("")
    setNewSubLessonVdoUrl("")
    setNewSubLessonVdoTime("")
    setIsAddSubLessonOpen(true)
  }

  const openEditLesson = (lesson) => {
    setEditLessonId(lesson.id)
    setEditLessonName(lesson.name)
    setIsEditLessonOpen(true)
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

  const handleUpdateLesson = async () => {
    if (!editLessonId || !editLessonName.trim()) return
    try {
      await axios.post(
        "/api/admin/lessons/update",
        {
          lesson_id: editLessonId,
          name: editLessonName.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setIsEditLessonOpen(false)
      await refreshLessons()
    } catch (error) {
      console.error("Update lesson failed:", error)
      setPageError(error.response?.data?.message || "Failed to update lesson")
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

  const handleVideoUpload = (videoData) => {
    setCourseData(prev => ({ 
      ...prev, 
      videoTrailerData: videoData,
      vdoTrailerUrl: videoData?.secure_url || "" 
    }))
  }

  const handleUpdateCourse = async () => {
    if (!id || !token) return

    setPageError("")
    try {
      await axios.post(
        "/api/admin/courses/update",
        {
          course_id: Number(id),
          course_name: courseData.name,
          price: Number(courseData.price),
          total_learning_time: Number(courseData.learningTime),
          course_summary: courseData.summary,
          course_detail: courseData.detail,
          cover_img_url: courseData.coverImgUrl,
          vdo_trailer_url: courseData.videoTrailerData?.secure_url || courseData.vdoTrailerUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      // Show success message or redirect
      alert("Course updated successfully!")
    } catch (error) {
      console.error("Update course failed:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setPageError(error.response?.data?.message || "Failed to update course")
    }
  }

  const moveLesson = async (lessonId, direction) => {
    const items = [...(courseData.lessons || [])].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    )
    const idx = items.findIndex((l) => l.id === lessonId)
    if (idx < 0) return

    const target = direction === "up" ? idx - 1 : idx + 1
    if (target < 0 || target >= items.length) return

    ;[items[idx], items[target]] = [items[target], items[idx]]

    const lesson_orders = items.map((item, i) => ({
      id: item.id,
      order_index: i + 1,
    }))

    try {
      await axios.post(
        "/api/admin/lessons/reorder",
        { course_id: Number(id), lesson_orders },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await refreshLessons()
    } catch (error) {
      console.error("Reorder lessons failed:", error)
      setPageError(error.response?.data?.message || "Failed to reorder lessons")
    }
  }

  const moveSubLesson = async (lesson, subLessonId, direction) => {
    const subItems = [...(lesson.sub_lessons || [])].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    )
    const idx = subItems.findIndex((s) => s.id === subLessonId)
    if (idx < 0) return

    const target = direction === "up" ? idx - 1 : idx + 1
    if (target < 0 || target >= subItems.length) return

    ;[subItems[idx], subItems[target]] = [subItems[target], subItems[idx]]

    const sub_lesson_orders = subItems.map((item, i) => ({
      id: item.id,
      order_index: i + 1,
    }))

    try {
      await axios.post(
        "/api/admin/sub-lessons/reorder",
        { lesson_id: lesson.id, sub_lesson_orders },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await refreshLessons()
    } catch (error) {
      console.error("Reorder sub-lessons failed:", error)
      setPageError(
        error.response?.data?.message || "Failed to reorder sub-lessons"
      )
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Edit Course - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800 flex items-center gap-2">
          <span className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => router.push('/admin/courses')}>&larr;</span>
          Course &apos;{courseData.name}&apos;
        </h1>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/admin/courses')}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateCourse}
            className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px]"
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
          <div className="col-span-2">
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course name <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={courseData.name} className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Price <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={courseData.price} type="number" className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Total learning time <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={courseData.learningTime} type="number" className="h-12 border-slate-300 text-[15px]" />
          </div>
        </div>

        <div className="mb-10 p-8 bg-[#F6F8FE] rounded-xl">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="promo"
              className="w-5 h-5 text-[#2F5FAC] rounded border-slate-300 focus:ring-[#2F5FAC]"
            // checked={hasPromoCode}
            // onChange={(e) => setHasPromoCode(e.target.checked)}
            />
            <Label htmlFor="promo" className="font-medium text-slate-800 text-[16px]">Promo code</Label>
          </div>

          {/* {hasPromoCode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Set promo code <span className="text-[#C82A2A]">*</span></Label>
                <Input defaultValue={courseData.promoCode} className="h-12 border-slate-300 bg-white text-[15px]" />
              </div>
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Minimum purchase amount (THB) <span className="text-[#C82A2A]">*</span></Label>
                <Input defaultValue={courseData.promoAmount} type="number" className="h-12 border-slate-300 bg-white text-[15px]" />
              </div>
              <div className="col-span-2">
                <Label className="mb-4 block text-slate-700 font-medium text-[15px]">Select discount type <span className="text-[#C82A2A]">*</span></Label>
                <RadioGroup defaultValue={courseData.discountType} className="flex flex-col sm:flex-row gap-12">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="thb" id="thb" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                    <Label htmlFor="thb" className="text-slate-700 font-medium text-[15px]">Discount (THB)</Label>
                    <Input defaultValue={courseData.discountValue} className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]" placeholder="200" />
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="percent" id="percent" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                    <Label htmlFor="percent" className="text-slate-700 font-medium text-[15px]">Discount (%)</Label>
                    <Input className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]" placeholder="Place Holder" />
                  </div>
                </RadioGroup>
              </div>
            </div>
          )} */}
        </div>

        <div className="space-y-8">
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course summary <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={courseData.summary} className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course detail <span className="text-[#C82A2A]">*</span></Label>
            <Textarea defaultValue={courseData.detail} className="min-h-[300px] border-slate-300 resize-none text-[14px] leading-relaxed p-4 text-slate-600" />
          </div>
        </div>

        <div className="space-y-8 mt-10">
          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Cover image <span className="text-[#C82A2A]">*</span></Label>
            <p className="text-[13px] text-slate-400 mb-3">Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB</p>
            <div className="w-[240px] h-[240px] relative rounded-xl overflow-hidden bg-[#1E293B] group">
              {/* Mock loaded image */}
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col justify-between p-2 opacity-80">
                <div className="w-full h-1/2 bg-blue-500/20 rounded-[2px]"></div>
                <div className="flex justify-between h-1/3 mt-2">
                  <div className="w-[45%] h-full bg-green-500/20 rounded-[2px]"></div>
                  <div className="w-[45%] h-full bg-orange-500/20 rounded-[2px]"></div>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 bg-[#A855F7] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#9333EA] shadow-sm">
                <span className="text-xs font-bold pb-[1px]">x</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Video Trailer <span className="text-[#C82A2A]">*</span></Label>
            
            {/* Video Upload Component */}
            <VideoUpload
              value={courseData.videoTrailerData}
              onChange={handleVideoUpload}
              className="mb-3"
            />
            
            {/* Fallback URL input for manual entry */}
            <div className="mt-4">
              <Input
                placeholder="Or enter video trailer URL manually"
                value={courseData.vdoTrailerUrl}
                onChange={(e) => setCourseData(prev => ({ ...prev, vdoTrailerUrl: e.target.value }))}
                className="h-12 border-slate-300 text-[15px]"
              />
            </div>
            
            <p className="text-[13px] text-slate-400 mt-2">
              Upload a video file or enter a URL. Supported formats: .mp4, .mov, .avi, .webm. Max file size: 50 MB
            </p>
          </div>

          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Attach File (Optional)</Label>
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
            className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-12 px-6 rounded-md font-medium shadow-sm text-[15px] disabled:opacity-50"
            disabled={isLoading || !token || !id}
          >
            + Add Lesson
          </Button>
        </div>

        <div className="bg-slate-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 bg-[#E2E8F0] p-4 text-slate-500 font-medium text-[15px]">
            <div className="col-span-1 text-center"></div>
            <div className="col-span-6">Lesson name</div>
            <div className="col-span-3">Sub-lesson</div>
            <div className="col-span-2 text-center">Action</div>
          </div>
          {/* Drag and Drop */}
          <div className="bg-white">
            {isLoading
              ? <div className="p-6 text-slate-500">Loading lessons...</div>
              : <SortableList
                lessons={courseData.lessons}
                setLessons={setLessons}
                courseId={id}
                token={token}
              />
            }
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            size="ghost"
            className="text-red-500 hover:text-red-500 active:text-red-500"
            onClick={() => setIsDeleteOpen(true)}
            disabled={deleteLoading}
          >
            Delete Course
          </Button>
        </div>
      </div>
      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        message="Are you sure you want to delete this course?"
        primaryLabel="No, keep it"
        secondaryLabel={deleteLoading ? "Deleting..." : "Yes, I want to delete this course"}
        onSecondaryClick={() => deleteCourse(id)}
      />
    </AdminLayout>
  )
}
