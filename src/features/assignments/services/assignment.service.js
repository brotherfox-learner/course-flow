/**
 * Assignment Service – data-access layer for the /api/assignments/ endpoints.
 * Used by the my-assignments page (submit-all flow).
 * The sub-lesson one-question-at-a-time flow uses learning.service.js.
 */

export async function fetchAssignmentList(token) {
  const res = await fetch("/api/assignments", {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Failed to fetch assignments")
  return data.assignments || []
}

export async function fetchAssignmentById(assignmentId, token) {
  const res = await fetch(`/api/assignments/${assignmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Failed to fetch assignment")
  return data
}

export async function submitAllAnswers(assignmentId, token, answers) {
  const res = await fetch(`/api/assignments/${assignmentId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Submit failed")
  return data
}

export async function retryAssignmentQuestion(assignmentId, token, questionId) {
  const res = await fetch(`/api/assignments/${assignmentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question_id: questionId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Retry failed")
  return data
}
