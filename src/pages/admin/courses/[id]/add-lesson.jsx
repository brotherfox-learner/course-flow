import AdminLayout from "@/components/layout/AdminLayout"
import Head from "next/head"
import Button from "@/common/navbar/Button"
import { Input } from "@base-ui/react"
import SortableListSub from "@/features/admin-lesson/component/SortableListSub"
import { useState } from "react"
import { useRouter } from "next/router"
import useCreateLesson from "@/features/admin-lesson/hook/useCreateLesson"
import { useAuth } from "@/context/AuthContext"
export default function AddLessons() {
    const { token } = useAuth()
    // const { id } = router.query
    const router = useRouter()
    const [lessonName, setLessonName] = useState("")
    const [subLessons, setSubLessons] = useState([
        {
            id: 1,
            name: "",
            type: "vdo",
            content: "",
            order_index: 1
        }
    ])
    const { createLesson } = useCreateLesson(token)
    function addSubLesson() {

        setSubLessons(prev => [
            ...prev,
            {
                id: Date.now(),
                name: "",
                type: "vdo",
                content: "",
                order_index: prev.length + 1
            }
        ])

    }
    function handleCreate() {

        if (!lessonName.trim()) {
            alert("Lesson name required")
            return
        }

        if (subLessons.length === 0) {
            alert("Add at least one sub-lesson")
            return
        }

        for (const sub of subLessons) {
            if (!sub.name.trim()) {
                alert("Sub-lesson name required")
                return
            }
        }

        createLesson(id, lessonName, lessons)

    }

    return (
        <AdminLayout>
            <Head>
                <title>Add Lesson - Admin Panel</title>
            </Head>
            <div className="flex justify-between items-center mb-8 bg-white py-[16px] px-[40px]">
                <h1 className="text-2xl font-medium text-slate-800 flex items-center gap-2">
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
                        size="lg"
                        onClick={handleCreate}
                    >
                        Create Lesson
                    </Button>
                </div>
            </div>
            <div className="p-10">
                <div className="flex flex-col items-start gap-10 bg-white border border-gray-200 px-[100px] pt-[40px] pb-[60px] rounded-2xl">
                    <div className="flex flex-col gap-1 w-full">
                        <label htmlFor="lesson">Lesson Name *</label>
                        <Input
                            id="lesson"
                            type="text"
                            value={lessonName}
                            onChange={(e) => setLessonName(e.target.value)}
                            className="p-3 border border-gray-400 rounded-lg"
                        />
                    </div>
                    <hr className="border-t-0 border-b border-b-gray-400 w-full" />
                    <p className="text-gray-700 text-[20px] font-semibold">Sub-Lessons</p>
                    <SortableListSub
                        subLessons={subLessons}
                        setSubLessons={setSubLessons}
                    />
                    <Button
                        variant="secondary"
                        onClick={addSubLesson}
                    >
                        + Add Sub-Lesson
                    </Button>
                </div>
            </div>
        </AdminLayout>
    )
}