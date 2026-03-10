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

export default function EditCourse() {
  const router = useRouter()
  const { id } = router.query
  const { token } = useAuth()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { deleteCourse, loading: deleteLoading } = useDeleteCourse(token)
  const {
    courseData,
    setLessons,
    setMaterials,
    isLoading
  } = useCourseEditor(id, token)

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
            variant="primary"
            size="lg">
            Edit
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
            <p className="text-[13px] text-slate-400 mb-3">Supported file types: .mp4, .mov, .avi. Max file size: 20 MB</p>
            <div className="w-[240px] h-[240px] relative rounded-xl overflow-hidden bg-[#1E293B] flex items-center justify-center group">
              {/* Mock loaded video */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col justify-between p-2 opacity-50">
                <div className="w-full h-1/2 bg-blue-500/20 rounded-[2px]"></div>
                <div className="flex justify-between h-1/3 mt-2">
                  <div className="w-[45%] h-full bg-green-500/20 rounded-[2px]"></div>
                  <div className="w-[45%] h-full bg-orange-500/20 rounded-[2px]"></div>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm z-10 cursor-pointer hover:bg-white/30 transition-colors">
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-2"></div>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 bg-[#A855F7] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#9333EA] shadow-sm z-10">
                <span className="text-xs font-bold pb-[1px]">x</span>
              </div>
            </div>
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
