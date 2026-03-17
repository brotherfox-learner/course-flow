import { useState } from "react"
import { retryAssignmentQuestion } from "../services/assignment.service"

/**
 * Handles retrying a single incorrect question (my-assignments flow).
 *
 * @param {string|number} assignmentId
 * @param {string|null} token
 * @param {Function} onRetrySuccess - called with questionId after successful retry
 * @param {Function} onRefresh - refetch assignment list
 */
export function useAssignmentRetry(assignmentId, token, onRetrySuccess, onRefresh) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState("")

  const handleRetry = async (qId) => {
    setRetryError("")
    setRetrying(true)
    try {
      await retryAssignmentQuestion(assignmentId, token, qId)
      onRetrySuccess(qId)
      onRefresh()
    } catch (e) {
      setRetryError(e.message)
    } finally {
      setRetrying(false)
    }
  }

  return { retrying, retryError, handleRetry }
}
