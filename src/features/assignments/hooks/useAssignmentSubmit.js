import { useState } from "react"
import { submitAllAnswers } from "../services/assignment.service"

/**
 * Handles submitting all answers at once (my-assignments flow).
 *
 * @param {string|number} assignmentId
 * @param {string|null} token
 * @param {Array} questions
 * @param {Function} getAns
 * @param {Function} onSuccess - called with gradingResults after successful submit
 * @param {Function} onRefresh - refetch assignment list after submit
 */
export function useAssignmentSubmit(assignmentId, token, questions, getAns, onSuccess, onRefresh) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    setSubmitError("")
    try {
      const payload = questions.map((q) => {
        const a = getAns(q.id)
        return {
          question_id: q.id,
          answer_text: q.question_type === "text" ? a.answer_text : null,
          selected_option_ids: q.question_type !== "text" ? a.selected_option_ids : [],
        }
      })

      const data = await submitAllAnswers(assignmentId, token, payload)

      const gr = {}
      for (const r of data.gradingResults) {
        if (r.option_results) {
          r.option_results = r.option_results.map((o) => ({
            ...o,
            option_id: Number(o.option_id),
          }))
        }
        gr[r.question_id] = r
      }

      onSuccess(gr)
      onRefresh()
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, submitError, handleSubmit }
}
