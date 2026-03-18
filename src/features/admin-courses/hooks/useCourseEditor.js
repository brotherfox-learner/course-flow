import { useState, useEffect } from "react"
import { fetchAdminCourse } from "../services/admin-course.service"

export default function useCourseEditor(id, token) {

    const [courseData, setCourseData] = useState({
        name: "",
        price: "",
        learningTime: "",
        summary: "",
        detail: "",
        lessons: [],
        materials: [],
    })

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    /* ---------------- FETCH COURSE ---------------- */

    useEffect(() => {

        if (!id || !token) return

        const load = async () => {

            try {

                setIsLoading(true)

                const data = await fetchAdminCourse(id, token)

                const course = data.course || data
                setCourseData({
                    id: course.id,
                    name: course.course_name,
                    price: course.price,
                    summary: course.course_summary,
                    detail: course.course_detail,
                    learningTime: course.total_learning_time,
                    coverImg: course.cover_img_url,
                    trailer: course.vdo_trailer_url,
                    lessons: data.lessons || [],
                    materials: data.materials || [],
                })

            } catch (err) {

                console.error("Fetch course error:", err)
                setError(err)

            } finally {

                setIsLoading(false)

            }

        }

        load()
    }, [id, token])


    /* ---------------- UPDATE LESSON STATE ---------------- */

    const setLessons = (updater) => {
        setCourseData((prev) => ({
            ...prev,
            lessons:
                typeof updater === "function"
                    ? updater(prev.lessons)
                    : updater
        }))
    }

    /* ---------------- UPDATE MATERIALS STATE ---------------- */

    const setMaterials = (updater) => {
        setCourseData((prev) => ({
            ...prev,
            materials:
                typeof updater === "function"
                    ? updater(prev.materials)
                    : updater
        }))
    }


    return {
        courseData,
        setCourseData,
        setLessons,
        setMaterials,
        isLoading,
        error
    }

}