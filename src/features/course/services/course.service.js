import axios from "axios"

/**
 * Course Service – data-access layer for course-related API calls.
 * Hooks call these functions; components never call them directly.
 */

export async function fetchCourses() {
  const { data } = await axios.get("/api/courses")
  return data.courses || []
}

export async function fetchCourseById(courseId) {
  const { data } = await axios.get(`/api/courses/${courseId}`)
  return data
}

export async function fetchLessonsByCourseId(courseId) {
  const { data } = await axios.get(`/api/lessons/${courseId}`)
  return Array.isArray(data) ? data : []
}

export async function fetchCourseMaterials(courseId, token) {
  const res = await fetch(`/api/courses/materials?courseId=${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch materials: ${res.status}`)
  const data = await res.json()
  return data.materials || []
}

export async function fetchEnrolledCourses(token) {
  const res = await fetch("/api/my-courses", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch enrolled courses: ${res.status}`)
  const data = await res.json()
  return data.courses || []
}

export async function checkEnrollment(courseId, token) {
  const res = await fetch(`/api/enrollments/check?courseId=${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to check enrollment: ${res.status}`)
  return res.json()
}
