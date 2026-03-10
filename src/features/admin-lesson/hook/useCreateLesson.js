import { useRouter } from "next/router"

export default function useCreateLesson(token) {

  const router = useRouter()

  async function createLesson(courseId, lessonName, subLessons) {

    try {

      const res = await fetch("/api/admin/lessons/create-with-sublessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: courseId,
          lesson_name: lessonName,
          sub_lessons: subLessons
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      console.log("Lesson created:", data)

      router.push(`/admin/courses/${courseId}`)

    } catch (err) {

      console.error("Create lesson error:", err)

      alert(err.message || "Failed to create lesson")

    }

  }

  return { createLesson }

}