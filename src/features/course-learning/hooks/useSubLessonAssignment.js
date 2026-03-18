import { useState, useEffect, useRef, useCallback } from "react"
import {
  buildGradingFromExisting,
  getStatusDisplay,
} from "@/features/assignments/utils/assignmentStatus"

const DEBOUNCE_MS = 1500
const AUTO_ADVANCE_MS = 1500

function findFirstUnansweredIndex(questions, grading) {
  if (!grading) return 0
  for (let i = 0; i < questions.length; i++) {
    if (!grading[questions[i].id]?.is_correct) return i
  }
  return questions.length - 1
}

function findNextUnansweredIndex(questions, grading, afterIndex) {
  for (let i = afterIndex + 1; i < questions.length; i++) {
    if (!grading?.[questions[i].id]?.is_correct) return i
  }
  for (let i = 0; i <= afterIndex; i++) {
    if (!grading?.[questions[i].id]?.is_correct) return i
  }
  return null
}

/**
 * Manages assignment state for the course-learning one-question-at-a-time flow.
 * Uses /api/sub-lessons/:subLessonId/assignment endpoints.
 *
 * @param {string|null} subLessonId
 * @param {string|null} token
 * @param {Function|null} onMarkComplete
 * @param {React.RefObject} hasMarkedCompleteRef
 * @param {React.RefObject} contentCompletedRef
 */
export function useSubLessonAssignment(
  subLessonId,
  token,
  onMarkComplete,
  hasMarkedCompleteRef,
  contentCompletedRef
) {
  const [assignmentData, setAssignmentData] = useState(null)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [gradingResults, setGradingResults] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState("")

  const saveDraftTimerRef = useRef(null)
  const autoAdvanceTimerRef = useRef(null)

  const questions = assignmentData?.questions || []
  const submissionStatus = assignmentData?.submission?.status || "pending"
  const submissionDisplay = getStatusDisplay(submissionStatus)
  const hasAssignment = assignmentData?.hasAssignment && questions.length > 0
  const isSubmittedOrGraded = submissionStatus === "submitted" || submissionStatus === "graded"

  useEffect(() => {
    return () => {
      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current)
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!subLessonId || !token) {
      setAssignmentData(null)
      setAnswers({})
      setGradingResults(null)
      setCurrentQuestionIndex(0)
      return
    }

    let cancelled = false
    const load = async () => {
      setAssignmentLoading(true)
      setGradingResults(null)
      setSubmitError("")
      setRetryError("")
      setCurrentQuestionIndex(0)

      try {
        const res = await fetch(`/api/sub-lessons/${subLessonId}/assignment`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled) return
        const data = await res.json()
        if (cancelled) return

        if (!data.hasAssignment) {
          setAssignmentData(null)
          setAnswers({})
          return
        }

        setAssignmentData(data)

        const init = {}
        ;(data.questions || []).forEach((q) => {
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
        setAnswers(init)

        const status = data.submission?.status || "pending"
        const grading = buildGradingFromExisting(data.questions || [], init, status)
        setGradingResults(grading)

        const startIdx = findFirstUnansweredIndex(data.questions || [], grading)
        setCurrentQuestionIndex(startIdx)
      } catch {
        if (!cancelled) setAssignmentData(null)
      } finally {
        if (!cancelled) setAssignmentLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [subLessonId, token])

  const saveDraft = useCallback(
    (questionId, answerData) => {
      if (!subLessonId || !token || !assignmentData?.hasAssignment) return
      if (
        assignmentData.submission?.status === "submitted" ||
        assignmentData.submission?.status === "graded"
      )
        return

      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current)
      saveDraftTimerRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/sub-lessons/${subLessonId}/assignment`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              question_id: questionId,
              answer_text: answerData.answer_text || null,
              selected_option_ids: answerData.selected_option_ids || [],
            }),
          })
        } catch {
          // silent
        }
      }, DEBOUNCE_MS)
    },
    [subLessonId, token, assignmentData]
  )

  const getAns = (qId) => answers[qId] || { selected_option_ids: [], answer_text: "" }

  const toggleOption = (qId, optId, qType) => {
    if (gradingResults?.[qId]) return
    const optIdNum = Number(optId)
    setAnswers((prev) => {
      const cur = prev[qId] || { selected_option_ids: [], answer_text: "" }
      const hasOpt = cur.selected_option_ids.some((i) => Number(i) === optIdNum)
      let ids
      if (qType === "single_choice") {
        ids = hasOpt ? [] : [optIdNum]
      } else {
        ids = hasOpt
          ? cur.selected_option_ids.filter((i) => Number(i) !== optIdNum)
          : [...cur.selected_option_ids.map(Number), optIdNum]
      }
      const newAns = { ...cur, selected_option_ids: ids }
      saveDraft(qId, newAns)
      return { ...prev, [qId]: newAns }
    })
  }

  const setTextAns = (qId, text) => {
    setAnswers((prev) => {
      const newAns = { ...(prev[qId] || { selected_option_ids: [] }), answer_text: text }
      saveDraft(qId, newAns)
      return { ...prev, [qId]: newAns }
    })
  }

  const currentQuestion = questions[currentQuestionIndex] || null

  const isCurrentAnswered = (() => {
    if (!currentQuestion) return false
    const a = getAns(currentQuestion.id)
    if (currentQuestion.question_type === "text") return a.answer_text.trim().length > 0
    return a.selected_option_ids.length > 0
  })()

  const handleSubmitCurrentQuestion = async () => {
    if (!currentQuestion || !isCurrentAnswered || submitting) return
    if (!subLessonId || !token) return

    setSubmitting(true)
    setSubmitError("")

    try {
      const ans = getAns(currentQuestion.id)
      const payload = {
        question_id: currentQuestion.id,
        answer_text: currentQuestion.question_type === "text" ? ans.answer_text : null,
        selected_option_ids:
          currentQuestion.question_type !== "text" ? ans.selected_option_ids : [],
      }

      const res = await fetch(`/api/sub-lessons/${subLessonId}/assignment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Submit failed")

      if (data.gradingResult.option_results) {
        data.gradingResult.option_results = data.gradingResult.option_results.map((o) => ({
          ...o,
          option_id: Number(o.option_id),
        }))
      }

      const newGrading = { ...(gradingResults || {}), [currentQuestion.id]: data.gradingResult }
      setGradingResults(newGrading)

      setAssignmentData((prev) => ({
        ...prev,
        submission: {
          ...prev.submission,
          status: data.submissionStatus,
          is_correct: data.submissionStatus === "submitted",
        },
      }))

      if (
        (data.submissionStatus === "submitted" || data.submissionStatus === "graded") &&
        subLessonId &&
        onMarkComplete &&
        !hasMarkedCompleteRef.current &&
        contentCompletedRef.current
      ) {
        hasMarkedCompleteRef.current = true
        onMarkComplete(subLessonId)
      }

      if (data.gradingResult.is_correct) {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
        autoAdvanceTimerRef.current = setTimeout(() => {
          const nextIdx = findNextUnansweredIndex(questions, newGrading, currentQuestionIndex)
          if (nextIdx !== null) setCurrentQuestionIndex(nextIdx)
        }, AUTO_ADVANCE_MS)
      }
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = async (qId) => {
    if (!subLessonId || !token) return
    setRetryError("")
    setRetrying(true)
    try {
      const res = await fetch(`/api/sub-lessons/${subLessonId}/assignment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question_id: qId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Retry failed")

      setGradingResults((prev) => {
        if (!prev) return prev
        const next = { ...prev }
        delete next[qId]
        return Object.keys(next).length === 0 ? null : next
      })
      setAnswers((prev) => ({ ...prev, [qId]: { selected_option_ids: [], answer_text: "" } }))
      setAssignmentData((prev) => ({
        ...prev,
        submission: { ...prev.submission, status: "inprogress", is_correct: null },
      }))
    } catch (e) {
      setRetryError(e.message)
    } finally {
      setRetrying(false)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const currentGr = gradingResults?.[currentQuestion?.id]
      if (currentGr?.is_correct) setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleNavigateToQuestion = (idx) => {
    setCurrentQuestionIndex(idx)
  }

  return {
    assignmentData,
    assignmentLoading,
    questions,
    submissionStatus,
    submissionDisplay,
    hasAssignment,
    isSubmittedOrGraded,
    gradingResults,
    currentQuestionIndex,
    currentQuestion,
    isCurrentAnswered,
    submitting,
    submitError,
    retrying,
    retryError,
    getAns,
    toggleOption,
    setTextAns,
    handleSubmitCurrentQuestion,
    handleRetry,
    handlePrevQuestion,
    handleNextQuestion,
    handleNavigateToQuestion,
  }
}
