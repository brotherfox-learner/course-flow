/**
 * Admin Lesson Service – data-access layer for admin lesson management API calls.
 */

export async function createLesson(payload, token) {
  const res = await fetch("/api/admin/lessons/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create lesson: ${res.status}`)
  return res.json()
}

export async function createLessonWithSubLessons(payload, token) {
  const res = await fetch("/api/admin/lessons/create-with-sublessons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create lesson with sub-lessons: ${res.status}`)
  return res.json()
}

export async function fetchLesson(lessonId, token) {
  const res = await fetch(`/api/admin/lessons/${lessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch lesson: ${res.status}`)
  return res.json()
}

export async function updateLesson(lessonId, payload, token) {
  const res = await fetch("/api/admin/lessons/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: lessonId, ...payload }),
  })
  if (!res.ok) throw new Error(`Failed to update lesson: ${res.status}`)
  return res.json()
}

export async function createSubLesson(payload, token) {
  const res = await fetch("/api/admin/sub-lessons/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create sub-lesson: ${res.status}`)
  return res.json()
}

export async function updateSubLesson(subLessonId, payload, token) {
  const res = await fetch("/api/admin/sub-lessons/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: subLessonId, ...payload }),
  })
  if (!res.ok) throw new Error(`Failed to update sub-lesson: ${res.status}`)
  return res.json()
}

export async function deleteSubLesson(subLessonId, token) {
  const res = await fetch("/api/admin/sub-lessons/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: subLessonId }),
  })
  if (!res.ok) throw new Error(`Failed to delete sub-lesson: ${res.status}`)
  return res.json()
}

export async function reorderSubLessons(lessonId, subLessonOrder, token) {
  const res = await fetch("/api/admin/sub-lessons/reorder", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lessonId, subLessonOrder }),
  })
  if (!res.ok) throw new Error(`Failed to reorder sub-lessons: ${res.status}`)
  return res.json()
}
