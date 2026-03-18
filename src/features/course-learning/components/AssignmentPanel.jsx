import Button from "@/shared/components/navbar/Button"

/**
 * Renders the assignment section within the course-learning view.
 * One-question-at-a-time flow with pagination dots.
 */
export default function AssignmentPanel({
  showPlaceholder,
  assignmentLoading,
  hasAssignment,
  questions,
  currentQuestionIndex,
  currentQuestion,
  isCurrentAnswered,
  submissionDisplay,
  gradingResults,
  isSubmittedOrGraded,
  submitting,
  submitError,
  retrying,
  retryError,
  getAns,
  onToggleOption,
  onSetTextAnswer,
  onSubmit,
  onRetry,
  onPrevQuestion,
  onNextQuestion,
  onNavigateToQuestion,
}) {
  const sc = submissionDisplay

  if (showPlaceholder) {
    return (
      <section
        className="flex flex-col items-start p-4 gap-4 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:p-6 lg:gap-[25px] flex-none order-2 self-stretch bg-blue-100 rounded-[8px]"
        aria-labelledby="assignment-heading-placeholder"
      >
        <header className="flex flex-row justify-between items-start gap-4 w-full">
          <h2 id="assignment-heading-placeholder" className="body1 text-black flex-1 min-w-0">
            Assignment
          </h2>
        </header>
        <p className="body2 text-gray-600">
          Select a sub-lesson from the sidebar to see the assignment.
        </p>
      </section>
    )
  }

  if (!assignmentLoading && !hasAssignment) return null

  return (
    <section
      className="flex flex-col items-start p-4 gap-4 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:p-6 lg:gap-5 flex-none order-2 self-stretch bg-blue-100 rounded-[8px]"
      aria-labelledby="assignment-heading"
    >
      {assignmentLoading ? (
        <div className="flex justify-center w-full py-6">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <header className="flex flex-row justify-between items-center gap-4 w-full">
            <h2 id="assignment-heading" className="body1 text-black flex-1 min-w-0">
              Assignment
            </h2>
            <span className={`body2 font-medium shrink-0 ${sc.className}`}>{sc.label}</span>
          </header>

          {questions.length > 1 && (
            <p className="body2 text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          )}

          {currentQuestion && (
            <div className="w-full border bg-white border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5">
                <QuestionView
                  question={currentQuestion}
                  answer={getAns(currentQuestion.id)}
                  grading={gradingResults?.[currentQuestion.id] || null}
                  isSubmittedOrGraded={isSubmittedOrGraded}
                  hasGradingResults={!!gradingResults}
                  onToggleOption={onToggleOption}
                  onSetTextAnswer={onSetTextAnswer}
                  onRetry={onRetry}
                  retrying={retrying}
                />
              </div>

              <footer className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
                {(submitError || retryError) && (
                  <p className="body3 text-red-500 flex-1">{submitError || retryError}</p>
                )}
                <div className="flex items-center gap-4 ml-auto">
                  {!gradingResults?.[currentQuestion.id] && !isSubmittedOrGraded && (
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={onSubmit}
                      disabled={!isCurrentAnswered || submitting}
                      className="body2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Submitting..." : "Submit Answer"}
                    </Button>
                  )}
                </div>
              </footer>
            </div>
          )}

          {questions.length > 1 && (
            <nav
              className="flex items-center justify-between w-full gap-4"
              aria-label="Question navigation"
            >
              <button
                type="button"
                onClick={onPrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="body2 font-medium text-blue-500 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                &larr; Previous
              </button>

              <div className="flex items-center gap-1.5">
                {questions.map((q, idx) => {
                  const gr = gradingResults?.[q.id]
                  const isCurrent = idx === currentQuestionIndex
                  let dotClass = "w-2.5 h-2.5 rounded-full transition-all"
                  if (isCurrent) dotClass += " w-3 h-3 bg-blue-500 ring-2 ring-blue-200"
                  else if (gr?.is_correct) dotClass += " bg-green-500"
                  else if (gr && !gr.is_correct) dotClass += " bg-red-400"
                  else dotClass += " bg-gray-300"

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        if (gr?.is_correct || idx <= currentQuestionIndex) {
                          onNavigateToQuestion(idx)
                        }
                      }}
                      className={dotClass}
                      aria-label={`Question ${idx + 1}`}
                      aria-current={isCurrent ? "step" : undefined}
                    />
                  )
                })}
              </div>

              <button
                type="button"
                onClick={onNextQuestion}
                disabled={
                  currentQuestionIndex >= questions.length - 1 ||
                  !gradingResults?.[currentQuestion?.id]?.is_correct
                }
                className="body2 font-medium text-blue-500 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next &rarr;
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}

function QuestionView({
  question,
  answer,
  grading,
  isSubmittedOrGraded,
  hasGradingResults,
  onToggleOption,
  onSetTextAnswer,
  onRetry,
  retrying,
}) {
  const q = question
  const ans = answer
  const gr = grading
  const isGraded = !!gr
  const isLocked = isSubmittedOrGraded && !hasGradingResults

  return (
    <div>
      <p className="body2 font-medium text-gray-800 mb-3">{q.question_text}</p>

      {q.question_type === "text" && (
        <div>
          <textarea
            value={ans.answer_text}
            onChange={(e) => onSetTextAnswer(q.id, e.target.value)}
            disabled={isGraded || isLocked}
            rows={3}
            placeholder="Answer..."
            className="w-full py-3 pr-4 pl-3 rounded-[8px] border border-gray-400 bg-white body2 text-black placeholder:text-gray-600 resize-y min-h-[96px] focus:outline-none focus:border-blue-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
          />
          {isGraded && (
            <div className="mt-2 space-y-2">
              <div
                className={`p-3 rounded-xl border ${
                  gr.correct_text_answer ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <p
                  className={`body3 font-medium mb-0.5 ${
                    gr.correct_text_answer ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {gr.correct_text_answer ? "Model answer:" : "No model answer set"}
                </p>
                {gr.correct_text_answer && (
                  <div className="body2 text-green-800 [&>span]:block">
                    {gr.correct_text_answer.split(/\r?\n/).map((line, i) => (
                      <span key={i}>{line || "\u00A0"}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="body2 text-green-600 font-medium">✓ Submitted</span>
                <button
                  type="button"
                  onClick={() => onRetry(q.id)}
                  disabled={retrying}
                  className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying ? "Retrying..." : "Try again"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(q.question_type === "single_choice" || q.question_type === "multiple_choice") && (
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
            } else if (!isGraded && !isLocked && selected) {
              optStyle = "border-blue-500 bg-blue-50 text-blue-700"
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isGraded || isLocked}
                onClick={() => onToggleOption(q.id, opt.id, q.question_type)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all body2 ${optStyle} disabled:cursor-default`}
              >
                {opt.option_text}
                {isGraded && gr.is_correct && !optResult?.was_selected && optResult?.is_correct && (
                  <span className="ml-2 text-green-500 text-[11px] font-medium">✓ correct</span>
                )}
              </button>
            )
          })}

          {isGraded && gr.is_correct && (
            <p className="body2 text-green-600 font-medium pt-1">✓ Correct!</p>
          )}
          {isGraded && !gr.is_correct && (
            <div className="flex items-center justify-between pt-1">
              <span className="body2 text-red-500 font-medium">✗ Incorrect</span>
              <button
                type="button"
                onClick={() => onRetry(q.id)}
                disabled={retrying}
                className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retrying ? "Retrying..." : "Try again"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
