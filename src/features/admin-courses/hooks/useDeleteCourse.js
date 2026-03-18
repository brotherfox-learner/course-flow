import { useRouter } from "next/router"
import { useState } from "react"

/*
Hook สำหรับลบ course
แยก logic ออกจาก UI
*/

export default function useDeleteCourse(token) {

    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function deleteCourse(courseId) {

        try {

            setLoading(true)

            /*
            ยิง API delete course
            */

            const res = await fetch("/api/admin/courses/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_id: courseId
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || "Delete failed")
            }

            console.log("Course deleted:", data)

            /*
            redirect กลับหน้า courses
            */

            router.push("/admin/courses")

        } catch (err) {

            console.error("Delete course error:", err)

            alert("Failed to delete course")

        } finally {

            setLoading(false)

        }

    }

    return {
        deleteCourse,
        loading
    }

}