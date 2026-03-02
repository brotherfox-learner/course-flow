import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import NavBar from "@/common/navbar/NavBar"
import Footer from "@/common/Footer"
import Pagination from "@/common/pagination"
import { useAuth } from "@/context/AuthContext"
import Head from "next/head"

const PAGE_SIZE = 4

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Badge = assignment_submissions.status from DB (pending | inprogress | submitted | graded)
function getDisplayStatus(a) {
  const sid = a?.submission_id ?? a?.submissionId
  if (sid == null || sid === "" || sid === 0) return "pending"
  const status = (a?.submission_status ?? a?.submissionStatus ?? "").toLowerCase()
  return status || "pending"
}

function getStatusConfig(statusKey) {
  const map = {
    pending: { label: "Pending", color: "text-[#996500] bg-[#FFFBDB] px-[8px] py-[4px] rounded-[4px]" },
    inprogress: { label: "In progress", color: "text-[#3557CF] bg-[#EBF0FF] px-[8px] py-[4px] rounded-[4px]" },
    draft: { label: "Draft", color: "text-slate-500" },
    submitted: { label: "Submitted", color: "text-green-600" },
    graded: { label: "Graded", color: "text-blue-600" },
  }
  return map[statusKey] || {
    label: statusKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "text-gray-600",
  }
}

// Tab filter: "In progress" tab = both pending AND inprogress (same filter)
function isInProgress(a) {
  const sid = a?.submission_id ?? a?.submissionId
  if (sid == null || sid === "" || sid === 0) return true
  const status = (a?.submission_status ?? a?.submissionStatus ?? "").toLowerCase()
  return status === "pending" || status === "inprogress"
}

// ─── Single assignment card ───────────────────────────────────────────────────

function AssignmentCard({ assignment, token, onRefresh }) {
  const [questions, setQuestions] = useState([])
  const [loadingQ, setLoadingQ] = useState(true)
  const [answers, setAnswers] = useState({}) // { [question_id]: { selected_option_ids, answer_text } }
  const [gradingResults, setGradingResults] = useState(null) // { [question_id]: result }
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const statusKey = getDisplayStatus(assignment)
  const sc = getStatusConfig(statusKey)

  // Load questions for this assignment
  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoadingQ(true)
      setGradingResults(null)
      try {
        const res = await fetch(`/api/assignments/${assignment.assignment_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        const qs = data.questions || []
        setQuestions(qs)

        // Pre-fill from existing answers (merge with init so all questions have an entry)
        const init = {}
        qs.forEach((q) => {
          init[q.id] = { selected_option_ids: [], answer_text: "" }
        })
        if (data.existingAnswers && data.existingAnswers.length > 0) {
          data.existingAnswers.forEach((a) => {
            const ids = (a.selected_option_ids || [])
            init[a.question_id] = {
              selected_option_ids: Array.isArray(ids) ? ids.map(Number) : [],
              answer_text: a.answer_text ?? "",
            }
          })
        }
        setAnswers(init)

        // When there is an existing submission (is_correct not null = submitted), build grading
        if (data.submission && data.submission.is_correct != null && qs.length > 0) {
          const grading = {}
          for (const q of qs) {
            const ans = init[q.id] || { selected_option_ids: [], answer_text: "" }
            const selectedIds = (ans.selected_option_ids || []).map(Number)
            if (q.question_type === "text") {
              grading[q.id] = {
                question_id: q.id,
                question_type: "text",
                is_correct: true,
                correct_text_answer: q.correct_text_answer ?? null,
              }
            } else {
              const options = q.options || []
              const correctIds = options.filter((o) => o.is_correct).map((o) => Number(o.id))
              const allCorrectSelected = correctIds.every((cid) => selectedIds.includes(cid))
              const noWrongSelected = selectedIds.every((sid) => correctIds.includes(sid))
              const is_correct =
                q.question_type === "single_choice"
                  ? selectedIds.length === 1 && correctIds.includes(selectedIds[0])
                  : allCorrectSelected && noWrongSelected
              grading[q.id] = {
                question_id: q.id,
                question_type: q.question_type,
                is_correct,
                correct_option_ids: correctIds,
                option_results: options.map((o) => ({
                  option_id: Number(o.id),
                  is_correct: !!o.is_correct,
                  was_selected: selectedIds.includes(Number(o.id)),
                })),
              }
            }
          }
          setGradingResults(grading)
        }
      } catch (e) {
        console.error("Failed to load questions:", e)
      } finally {
        setLoadingQ(false)
      }
    }
    load()
  }, [assignment.assignment_id, token])

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

  const allAnswered = questions.every((q) => {
    const a = getAns(q.id)
    if (q.question_type === "text") return a.answer_text.trim().length > 0
    return a.selected_option_ids.length > 0
  })

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return
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
      const res = await fetch(`/api/assignments/${assignment.assignment_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Submit failed")

      // Map grading by question_id
      // Normalize option_id to number so comparison with opt.id works (DB may return bigint as string)
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
      setGradingResults(gr)
      // Refresh list so card status (Submitted) updates from DB
      onRefresh()
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState("")

  const handleRetry = async (qId) => {
    setRetryError("")
    setRetrying(true)
    try {
      const res = await fetch(`/api/assignments/${assignment.assignment_id}`, {
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
      setAnswers((prev) => ({
        ...prev,
        [qId]: { selected_option_ids: [], answer_text: "" },
      }))
      onRefresh()
    } catch (e) {
      setRetryError(e.message)
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="bg-blue-100 flex flex-col mx-auto w-[1120px] rounded-2xl shadow-1 p-6 mb-6">
      {/* Card header */}
      <div className="flex items-start justify-between mb-1">
        <h2 className="body2 font-medium text-gray-900">
          Course: {assignment.course_name}
        </h2>
        <span className={`body3 font-medium shrink-0 ml-4 ${sc.color}`}>
          {sc.label}
        </span>
      </div>
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
            {questions.map((q, idx) => {
              const ans = getAns(q.id)
              const gr = gradingResults?.[q.id]
              const isGraded = !!gr
              const isSubmitted = (statusKey === "submitted" || statusKey === "graded") && !gradingResults

              return (
                <div key={q.id}>
                  {/* Question text */}
                  <p className="body3 font-medium text-gray-800 mb-3">
                    {questions.length > 1 ? `${idx + 1}. ` : ""}{q.question_text}
                  </p>

                  {/* TEXT type */}
                  {q.question_type === "text" && (
                    <div>
                      <textarea
                        value={ans.answer_text}
                        onChange={(e) => setTextAns(q.id, e.target.value)}
                        disabled={isGraded || isSubmitted}
                        rows={3}
                        placeholder="Answer..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 body3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-y transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      {isGraded && (
                        <div className={`mt-2 p-3 rounded-xl border ${gr.correct_text_answer
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                          }`}>
                          <p className={`body4 font-medium mb-0.5 ${gr.correct_text_answer ? "text-green-700" : "text-gray-500"
                            }`}>
                            {gr.correct_text_answer ? "Model answer:" : "No model answer set"}
                          </p>
                          {gr.correct_text_answer && (
                            <p className="body3 text-green-800">{gr.correct_text_answer}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SINGLE / MULTIPLE choice */}
                  {(q.question_type === "single_choice" || q.question_type === "multiple_choice") && (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const selected = ans.selected_option_ids.some((id) => Number(id) === Number(opt.id))
                        const optResult = gr?.option_results?.find(
                          (r) => Number(r.option_id) === Number(opt.id)
                        )

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
                            onClick={() => toggleOption(q.id, opt.id, q.question_type)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all body3 ${optStyle} disabled:cursor-default`}
                          >
                            {opt.option_text}
                            {isGraded && gr.is_correct && !optResult?.was_selected && optResult?.is_correct && (
                              <span className="ml-2 text-green-500 text-[11px] font-medium">✓ correct</span>
                            )}
                          </button>
                        )
                      })}

                      {/* Single choice retry */}
                      {isGraded && q.question_type === "single_choice" && !gr.is_correct && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="body3 text-red-500 font-medium">✗ Incorrect</span>
                          <button
                            onClick={() => handleRetry(q.id)}
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
                      {/* Multiple choice retry */}
                      {isGraded && q.question_type === "multiple_choice" && !gr.is_correct && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="body3 text-orange-500 font-medium">Some answers need review</span>
                          <button
                            onClick={() => handleRetry(q.id)}
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
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            {(submitError || retryError) && (
              <p className="body4 text-red-500 flex-1">{submitError || retryError}</p>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <a
                href={`/courses/${assignment.course_id}/learn`}
                className="body3 text-blue-500 hover:text-blue-700 font-medium underline underline-offset-2 whitespace-nowrap"
              >
                Open in Course
              </a>
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
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All" },
  { key: "inprogress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
]

export default function AssignmentsPage() {
  const router = useRouter()
  const { token, loading: authLoading, isLoggedIn } = useAuth()

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login")
  }, [authLoading, isLoggedIn, router])

  const fetchAssignments = useCallback(async () => {
    if (!token) {
      setLoading(false)
      setAssignments([])
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed")
      setAssignments(data.assignments || [])
    } catch (e) {
      setError(e.message)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // Tab filter: use actual submission_status from DB
  const filtered = assignments.filter((a) => {
    if (activeTab === "all") return true
    if (activeTab === "inprogress") return isInProgress(a)
    if (activeTab === "submitted") return !isInProgress(a)
    return true
  })

  if (authLoading) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white" />
        <Footer />
      </>
    )
  }

  return (
    <div className="overflow-x-hidden">
      <Head>
        <title>My Assignments - CourseFlow</title>
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#F6F7FC] relative">
        {/* Decorative elements */}
        <div>
          <img src="/ellipse.svg" className=" absolute w-9 h-9  right-[-12px] top-[161px] lg:w-[74px] lg:h-[74px] lg:top-[205px] lg:right-[-21px]" alt="" />
          <img src="/green_cross.svg" className=" absolute w-[15.56px] h-[15.56px] left-[71px] top-[177px] lg:w-[18px] lg:h-[18px] lg:top-[205px] lg:left-[250px]" alt="" />
          <div className="absolute  w-[8.56px] h-[8.56px] left-[36px] top-[40px] rounded-full  border-[3px] lg:w-[10px] lg:h-[10px] lg:left-[75px] lg:top-[50px] border-[#2F5FAC] box-sizing-border" aria-hidden="true" />
          <img src="/orange_polygon.svg" className=" absolute w-[27.75px]  h-[27.75px] right-[45px] top-[60px] lg:w-[35px] lg:h-[35px] lg:right-[106px] lg:top-[125px]" alt="" />
          <img src="/ellipse.svg" className=" absolute w-[20.25px]  h-[20.25px] left-[-10px] top-[85.92px] lg:w-[25px] lg:h-[25px] lg:left-[32px] lg:top-[107px]" alt="" />
        </div>
        <div className="lg:hidden pointer-events-none absolute top-[30px] left-[20px] w-[8px] h-[8px] bg-blue-300 rounded-full opacity-60" />

        <div className="max-w-[1440px] mx-auto px-4 lg:px-[160px] pt-12 lg:pt-16 pb-24">
          {/* Title */}
          <h1 className="headline2 text-black text-center mb-8">My Assignments</h1>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-gray-300 mb-8 justify-center lg:justify-center">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setCurrentPage(1)
                }}
                className={`pb-3 body2 font-medium transition-colors relative ${activeTab === tab.key
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="body3 text-red-600">{error}</p>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center max-w-md mx-auto">
              <p className="body2 text-gray-600 font-medium mb-2">No assignments right now</p>
              <p className="body3 text-gray-500">
                Assignments appear when you are enrolled in a course that has them.
                Go to My Courses to see your enrolled courses.
              </p>
              <a
                href="/my-courses"
                className="inline-block mt-4 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white body3 font-medium rounded-xl transition-colors"
              >
                Go to My Courses
              </a>
            </div>
          ) : (
            <>
              <div className=" mx-auto lg:mx-0 flex flex-col gap-4 w-full items-center justify-center">
                {filtered
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((a) => (
                    <AssignmentCard
                      key={a.assignment_id}
                      assignment={a}
                      token={token}
                      onRefresh={fetchAssignments}
                    />
                  ))}
              </div>
              {filtered.length > 0 && (
                <div className="flex justify-center mt-8 mb-15">
                  {filtered.length > PAGE_SIZE ? (
                    <Pagination
                      currentPage={currentPage}
                      totalItems={filtered.length}
                      pageSize={PAGE_SIZE}
                      onPageChange={setCurrentPage}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Page 1 of 1 ({filtered.length} assignment{filtered.length !== 1 ? "s" : ""})
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
