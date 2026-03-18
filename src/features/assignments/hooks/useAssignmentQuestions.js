import { useState, useEffect } from "react"
import { fetchAssignmentById } from "../services/assignment.service"

/**
 * Fetches questions for a specific assignment and pre-fills existing answers.
 * Used in AssignmentCard (my-assignments submit-all flow).
 *
 * @param {string|number} assignmentId
 * @param {string|null} token
 */
export function useAssignmentQuestions(assignmentId, token) {
  const [questions, setQuestions] = useState([])
  const [submission, setSubmission] = useState(null)
  const [loadingQ, setLoadingQ] = useState(true)
  const [initAnswers, setInitAnswers] = useState({})

  useEffect(() => {
    if (!token || !assignmentId) return

    let cancelled = false
    const load = async () => {
      setLoadingQ(true)
      try {
        const data = await fetchAssignmentById(assignmentId, token)
        if (cancelled) return

        const qs = data.questions || []
        setQuestions(qs)
        setSubmission(data.submission || null)

        const init = {}
        qs.forEach((q) => {
          init[q.id] = { selected_option_ids: [], answer_text: "" }
        })
        if (data.existingAnswers?.length > 0) {
          data.existingAnswers.forEach((a) => {
            const ids = a.selected_option_ids || []
            init[a.question_id] = {
              selected_option_ids: Array.isArray(ids) ? ids.map(Number) : [],
              answer_text: a.answer_text ?? "",
            }
          })
        }
        setInitAnswers(init)
      } catch (e) {
        if (!cancelled) console.error("Failed to load questions:", e)
      } finally {
        if (!cancelled) setLoadingQ(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [assignmentId, token])

  return { questions, submission, loadingQ, initAnswers }
}
