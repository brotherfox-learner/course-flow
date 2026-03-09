import { useState, useEffect } from "react"

export default function useCourseEditor(id, token) {

    const [courseData, setCourseData] = useState({
        name: "",
        price: "",
        learningTime: "",
        summary: "",
        detail: "",
        lessons: []
    })

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    /* ---------------- FETCH COURSE ---------------- */

    useEffect(() => {

        if (!id || !token) return

        const fetchCourse = async () => {

            try {

                setIsLoading(true)

                const res = await fetch(
                    `/api/admin/courses/${id}?include=structure`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                const data = await res.json()

                console.log("Course API:", data)

                setCourseData({
                    id: data.id,
                    name: data.course_name,
                    price: data.price,
                    summary: data.course_summary,
                    detail: data.course_detail,
                    learningTime: data.total_learning_time,
                    coverImg: data.cover_img_url,
                    trailer: data.vdo_trailer_url,
                    lessons: data.lessons || []
                })

            } catch (err) {

                console.error("Fetch course error:", err)
                setError(err)

            } finally {

                setIsLoading(false)

            }

        }

        fetchCourse()
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


    return {
        courseData,
        setCourseData,
        setLessons,
        isLoading,
        error
    }

}