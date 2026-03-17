import { useState, useEffect } from "react"

/**
 * Manages quiz answer state: selection toggling, text answers, and answered check.
 * Works with both my-assignments (submit-all) and course-learning (one-question) flows.
 *
 * @param {Array} questions
 * @param {Object} initAnswers - pre-filled answer map from useAssignmentQuestions
 * @param {Object|null} gradingResults
 */
export function useQuizAnswers(questions, initAnswers, gradingResults) {
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    if (Object.keys(initAnswers).length > 0) {
      setAnswers(initAnswers)
    }
  }, [initAnswers])

  const getAns = (qId) =>
    answers[qId] || { selected_option_ids: [], answer_text: "" }

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
      return { ...prev, [qId]: { ...cur, selected_option_ids: ids } }
    })
  }

  const setTextAns = (qId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...(prev[qId] || { selected_option_ids: [] }), answer_text: text },
    }))
  }

  const clearAnswer = (qId) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { selected_option_ids: [], answer_text: "" },
    }))
  }

  const allAnswered = questions.every((q) => {
    const a = getAns(q.id)
    if (q.question_type === "text") return a.answer_text.trim().length > 0
    return a.selected_option_ids.length > 0
  })

  return { answers, getAns, toggleOption, setTextAns, clearAnswer, allAnswered }
}
