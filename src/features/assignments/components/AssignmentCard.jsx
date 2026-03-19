import { useState, useEffect } from "react"
import Link from "next/link"
import { useAssignmentQuestions } from "../hooks/useAssignmentQuestions"

function slugifySubLesson(id, name) {
  const idPart = id != null ? String(id) : null
  const namePart = typeof name === "string" ? name : ""
  const base = namePart.trim()
  const nameSlug = base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  if (!idPart) return null
  return nameSlug ? `${idPart}-${nameSlug}` : idPart
}
import { useQuizAnswers } from "../hooks/useQuizAnswers"
import { useAssignmentSubmit } from "../hooks/useAssignmentSubmit"
import { useAssignmentRetry } from "../hooks/useAssignmentRetry"
import { getDisplayStatus, getStatusConfig, buildGradingFromExisting } from "../utils/assignmentStatus"

/**
 * Renders a single assignment card with full quiz interaction.
 * Used in the my-assignments page.
 */
export default function AssignmentCard({ assignment, token, onRefresh }) {
  const statusKey = getDisplayStatus(assignment)
  const learnSlug = slugifySubLesson(assignment.sub_lesson_id, assignment.sub_lesson_name)
  const learnHref = learnSlug
    ? `/courses/${assignment.course_id}/learn/${learnSlug}`
    : `/courses/${assignment.course_id}/learn`
  const sc = getStatusConfig(statusKey)

  const { questions, submission, loadingQ, initAnswers } = useAssignmentQuestions(
    assignment.assignment_id,
    token
  )

  const [gradingResults, setGradingResults] = useState(null)

  useEffect(() => {
    if (!loadingQ && questions.length > 0 && submission) {
      const submissionStatus = submission?.status || "pending"
      if (submissionStatus !== "pending" && Object.keys(initAnswers).length > 0) {
        const grading = buildGradingFromExisting(questions, initAnswers, submissionStatus)
        setGradingResults(grading)
      }
    }
  }, [loadingQ, questions, initAnswers, submission])

  const { getAns, toggleOption, setTextAns, clearAnswer, allAnswered } = useQuizAnswers(
    questions,
    initAnswers,
    gradingResults
  )

  const { submitting, submitError, handleSubmit } = useAssignmentSubmit(
    assignment.assignment_id,
    token,
    questions,
    getAns,
    (gr) => setGradingResults(gr),
    onRefresh
  )

  const { retrying, retryError, handleRetry } = useAssignmentRetry(
    assignment.assignment_id,
    token,
    (qId) => {
      setGradingResults((prev) => {
        if (!prev) return prev
        const next = { ...prev }
        delete next[qId]
        return Object.keys(next).length === 0 ? null : next
      })
      clearAnswer(qId)
    },
    onRefresh
  )

  return (
    <article className="bg-blue-100 flex flex-col mx-auto md:w-[1120px] w-[343px] rounded-2xl shadow-1 p-6 mb-6">
      <header className="flex items-start justify-between mb-1">
        <h2 className="body2 font-medium text-gray-900">
          Course: {assignment.course_name}
        </h2>
        <span className={`body3 font-medium shrink-0 ml-4 ${sc.color}`}>
          {sc.label}
        </span>
      </header>
      <p className="body3 text-gray-500 mb-5">
        {assignment.lesson_name}: {assignment.sub_lesson_name}
      </p>

      {loadingQ ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="border bg-white border-gray-200 rounded-xl overflow-hidden">
          <div className="p-5 space-y-6">
            {questions.map((q, idx) => (
              <QuestionItem
                key={q.id}
                question={q}
                idx={idx}
                total={questions.length}
                ans={getAns(q.id)}
                grading={gradingResults?.[q.id]}
                statusKey={statusKey}
                gradingResults={gradingResults}
                onToggle={toggleOption}
                onTextChange={setTextAns}
                onRetry={handleRetry}
                retrying={retrying}
              />
            ))}
          </div>

          <footer className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            {(submitError || retryError) && (
              <p className="body4 text-red-500 flex-1">{submitError || retryError}</p>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <Link
                href={learnHref}
                className="body3 text-blue-500 hover:text-blue-700 font-medium underline underline-offset-2 whitespace-nowrap"
              >
                Open in Course
              </Link>
              {(gradingResults === null || !questions.every((q) => gradingResults?.[q.id])) && (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white body3 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </footer>
        </div>
      )}
    </article>
  )
}

function QuestionItem({ question: q, idx, total, ans, grading: gr, statusKey, gradingResults, onToggle, onTextChange, onRetry, retrying }) {
  const isGraded = !!gr
  const isSubmitted = (statusKey === "submitted" || statusKey === "graded") && !gradingResults

  return (
    <div>
      <p className="body3 font-medium text-gray-800 mb-3">
        {total > 1 ? `${idx + 1}. ` : ""}{q.question_text}
      </p>

      {q.question_type === "text" && (
        <TextAnswer
          ans={ans}
          grading={gr}
          isGraded={isGraded}
          isSubmitted={isSubmitted}
          qId={q.id}
          onTextChange={onTextChange}
        />
      )}

      {(q.question_type === "single_choice" || q.question_type === "multiple_choice") && (
        <ChoiceAnswer
          question={q}
          ans={ans}
          grading={gr}
          isGraded={isGraded}
          isSubmitted={isSubmitted}
          onToggle={onToggle}
          onRetry={onRetry}
          retrying={retrying}
        />
      )}
    </div>
  )
}

function TextAnswer({ ans, grading: gr, isGraded, isSubmitted, qId, onTextChange }) {
  return (
    <div>
      <textarea
        value={ans.answer_text}
        onChange={(e) => onTextChange(qId, e.target.value)}
        disabled={isGraded || isSubmitted}
        rows={3}
        placeholder="Answer..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 body3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-y transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      />
      {isGraded && (
        <div className={`mt-2 p-3 rounded-xl border ${gr.correct_text_answer ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <p className={`body4 font-medium mb-0.5 ${gr.correct_text_answer ? "text-green-800" : "text-gray-500"}`}>
            {gr.correct_text_answer ? "Model answer:" : "No model answer set"}
          </p>
          {gr.correct_text_answer && (
            <div className="body3 text-green-800 [&>span]:block">
              {gr.correct_text_answer.split(/\r?\n/).map((line, i) => (
                <span key={i}>{line || "\u00A0"}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChoiceAnswer({ question: q, ans, grading: gr, isGraded, isSubmitted, onToggle, onRetry, retrying }) {
  return (
    <div className="space-y-2">
      {q.options.map((opt) => {
        const selected = ans.selected_option_ids.some((id) => Number(id) === Number(opt.id))
        const optResult = gr?.option_results?.find((r) => Number(r.option_id) === Number(opt.id))

        let optStyle = "border-gray-200 bg-white text-gray-700"
        if (isGraded && optResult) {
          if (optResult.was_selected && optResult.is_correct) optStyle = "border-green-500 bg-green-50 text-green-700"
          else if (optResult.was_selected && !optResult.is_correct) optStyle = "border-red-400 bg-red-50 text-red-600"
          else if (!optResult.was_selected && optResult.is_correct && gr.is_correct) optStyle = "border-green-200 bg-green-50/40 text-green-600"
          else optStyle = "border-gray-100 bg-gray-50 text-gray-400"
        } else if (!isGraded && !isSubmitted && selected) {
          optStyle = "border-blue-500 bg-blue-50 text-blue-700"
        }

        return (
          <button
            key={opt.id}
            type="button"
            disabled={isGraded || isSubmitted}
            onClick={() => onToggle(q.id, opt.id, q.question_type)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all body3 ${optStyle} disabled:cursor-default`}
          >
            {opt.option_text}
            {isGraded && gr.is_correct && !optResult?.was_selected && optResult?.is_correct && (
              <span className="ml-2 text-green-500 text-[11px] font-medium">✓ correct</span>
            )}
          </button>
        )
      })}

      {isGraded && q.question_type === "single_choice" && !gr.is_correct && (
        <div className="flex items-center justify-between pt-1">
          <span className="body3 text-red-500 font-medium">✗ Incorrect</span>
          <button
            onClick={() => onRetry(q.id)}
            disabled={retrying}
            className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? "Retrying..." : "Try again"}
          </button>
        </div>
      )}
      {isGraded && q.question_type === "single_choice" && gr.is_correct && (
        <p className="body3 text-green-600 font-medium pt-1">✓ Correct!</p>
      )}
      {isGraded && q.question_type === "multiple_choice" && !gr.is_correct && (
        <div className="flex items-center justify-between pt-1">
          <span className="body3 text-orange-500 font-medium">Some answers need review</span>
          <button
            onClick={() => onRetry(q.id)}
            disabled={retrying}
            className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? "Retrying..." : "Try again"}
          </button>
        </div>
      )}
      {isGraded && q.question_type === "multiple_choice" && gr.is_correct && (
        <p className="body3 text-green-600 font-medium pt-1">✓ All correct!</p>
      )}
    </div>
  )
}
