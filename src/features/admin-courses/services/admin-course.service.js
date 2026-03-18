/**
 * Admin Course Service – data-access layer for admin course management API calls.
 */

export async function fetchAdminCourse(id, token) {
  const res = await fetch(`/api/admin/courses/${id}?include=structure`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch course: ${res.status}`)
  return res.json()
}

export async function fetchAdminCourses(token) {
  const res = await fetch("/api/admin/courses", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`)
  return res.json()
}

export async function createCourse(payload, token) {
  const res = await fetch("/api/admin/courses/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create course: ${res.status}`)
  return res.json()
}

export async function updateCourse(id, payload, token) {
  const res = await fetch("/api/admin/courses/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, ...payload }),
  })
  if (!res.ok) throw new Error(`Failed to update course: ${res.status}`)
  return res.json()
}

export async function deleteCourse(id, token) {
  const res = await fetch("/api/admin/courses/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(`Failed to delete course: ${res.status}`)
  return res.json()
}

export async function reorderLessons(courseId, lessonOrder, token) {
  const res = await fetch("/api/admin/lessons/reorder", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId, lessonOrder }),
  })
  if (!res.ok) throw new Error(`Failed to reorder lessons: ${res.status}`)
  return res.json()
}

export async function deleteLesson(lessonId, token) {
  const res = await fetch("/api/admin/lessons/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: lessonId }),
  })
  if (!res.ok) throw new Error(`Failed to delete lesson: ${res.status}`)
  return res.json()
}
