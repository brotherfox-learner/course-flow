import axios from "axios"

/**
 * Learning Service – data-access layer for course-learning API calls.
 */

export async function fetchSubLesson(subLessonId, token) {
  const { data } = await axios.get(`/api/sub-lessons/${subLessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function saveSubLessonTime(subLessonId, token, timeData) {
  const { data } = await axios.post(
    `/api/sub-lessons/${subLessonId}/time`,
    timeData,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data
}

export async function fetchAssignment(subLessonId, token) {
  const res = await fetch(`/api/sub-lessons/${subLessonId}/assignment`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch assignment: ${res.status}`)
  return res.json()
}

export async function submitAssignment(subLessonId, token, payload) {
  const res = await fetch(`/api/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subLessonId, ...payload }),
  })
  if (!res.ok) throw new Error(`Failed to submit assignment: ${res.status}`)
  return res.json()
}

export async function fetchCourseProgress(courseId, token) {
  const res = await fetch(`/api/courses/${courseId}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch progress: ${res.status}`)
  return res.json()
}

export async function saveVideo(token, payload) {
  const { data } = await axios.post("/api/videos/save", payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}
