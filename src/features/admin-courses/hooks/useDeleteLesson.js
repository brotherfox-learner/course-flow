import { useState } from "react"
import { useAuth } from "@/features/auth/context/AuthContext"

/*
Hook สำหรับลบ lesson
*/

export default function useDeleteLesson() {

  const { token } = useAuth()
  const [loading, setLoading] = useState(false)

  async function deleteLesson(lessonId) {

    try {

      setLoading(true)

      const res = await fetch("/api/admin/lessons/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lesson_id: lessonId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Delete lesson failed")
      }

      console.log("Lesson deleted:", lessonId)

      return true

    } catch (err) {

      console.error("Delete lesson error:", err)

      alert(err.message)

      return false

    } finally {

      setLoading(false)

    }

  }

  return {
    deleteLesson,
    loading
  }

}