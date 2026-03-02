import Head from "next/head"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import AdminLayout from "@/components/layout/AdminLayout"
import { useRouter } from "next/router"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { Trash2, Plus, ChevronDown } from "lucide-react"

const QUESTION_TYPES = [
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "text", label: "Text" },
]

function createEmptyQuestion() {
  return {
    _id: Date.now() + Math.random(),
    question_text: "",
    question_type: "single_choice",
    correct_text_answer: "",
    options: [
      { _id: Date.now() + Math.random() + 1, option_text: "", is_correct: false },
      { _id: Date.now() + Math.random() + 2, option_text: "", is_correct: false },
    ],
  }
}

function mapQuestionsFromApi(apiQuestions = []) {
  return apiQuestions.map((q) => ({
    _id: q.id,
    question_text: q.question_text || "",
    question_type: q.question_type || "single_choice",
    correct_text_answer: q.correct_text_answer || "",
    options: (q.options || []).map((o) => ({
      _id: o.id,
      option_text: o.option_text || "",
      is_correct: o.is_correct || false,
    })),
  }))
}

export default function EditAssignment() {
  const router = useRouter()
  const { id } = router.query
  const { token, loading, logout } = useAuth()

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [assignmentTitle, setAssignmentTitle] = useState("")

  const [coursesTree, setCoursesTree] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedLessonId, setSelectedLessonId] = useState("")
  const [selectedSubLessonId, setSelectedSubLessonId] = useState("")

  const [questions, setQuestions] = useState([createEmptyQuestion()])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!loading && !token) router.push("/admin/login")
  }, [loading, token, router])

  // Load courses tree
  useEffect(() => {
    if (!token) return
    axios
      .get("/api/admin/assignments/courses-tree", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCoursesTree(res.data.courses || []))
      .catch((err) => console.error("Fetch courses tree error:", err))
  }, [token])

  // Load assignment data
  useEffect(() => {
    if (!id || !token) return
    const fetchAssignment = async () => {
      setIsPageLoading(true)
      setPageError("")
      try {
        const res = await axios.get(`/api/admin/assignments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const a = res.data.assignment
        setAssignmentTitle(a.first_question || a.questions?.[0]?.question_text || "Assignment")
        setSelectedCourseId(String(a.course_id))
        setSelectedLessonId(String(a.lesson_id))
        setSelectedSubLessonId(String(a.sub_lesson_id))
        setQuestions(mapQuestionsFromApi(a.questions))
      } catch (error) {
        console.error("Fetch assignment error:", error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          await logout()
          return
        }
        setPageError("Failed to load assignment")
      } finally {
        setIsPageLoading(false)
      }
    }
    fetchAssignment()
  }, [id, token, logout])

  const selectedCourse = coursesTree.find((c) => String(c.id) === String(selectedCourseId))
  const lessons = selectedCourse?.lessons || []
  const selectedLesson = lessons.find((l) => String(l.id) === String(selectedLessonId))
  const subLessons = selectedLesson?.sub_lessons || []

  const handleCourseChange = (val) => {
    setSelectedCourseId(val)
    setSelectedLessonId("")
    setSelectedSubLessonId("")
  }
  const handleLessonChange = (val) => {
    setSelectedLessonId(val)
    setSelectedSubLessonId("")
  }

  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx
          ? {
              ...q,
              [field]: value,
              ...(field === "question_type" && value === "text"
                ? { options: [] }
                : field === "question_type"
                ? {
                    options: [
                      { _id: Date.now() + 1, option_text: "", is_correct: false },
                      { _id: Date.now() + 2, option_text: "", is_correct: false },
                    ],
                    correct_text_answer: "",
                  }
                : {}),
            }
          : q
      )
    )
  }

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const addOption = (qIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: [
                ...q.options,
                { _id: Date.now() + Math.random(), option_text: "", is_correct: false },
              ],
            }
          : q
      )
    )
  }

  const updateOption = (qIdx, oIdx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q
        const newOpts = q.options.map((o, j) => {
          if (j !== oIdx) {
            if (field === "is_correct" && value && q.question_type === "single_choice") {
              return { ...o, is_correct: false }
            }
            return o
          }
          return { ...o, [field]: value }
        })
        return { ...q, options: newOpts }
      })
    )
  }

  const removeOption = (qIdx, oIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.filter((_, j) => j !== oIdx) }
          : q
      )
    )
  }

  const validate = () => {
    const newErrors = {}
    if (!selectedSubLessonId) newErrors.subLesson = "Please select a sub-lesson"
    if (questions.length === 0) newErrors.questions = "At least one question is required"
    questions.forEach((q, i) => {
      if (!q.question_text.trim()) newErrors[`q_${i}_text`] = "Question text is required"
    })
    return newErrors
  }

  const handleSave = async () => {
    setSubmitError("")
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        assignment_id: Number(id),
        sub_lesson_id: Number(selectedSubLessonId),
        questions: questions.map((q) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          correct_text_answer: q.question_type === "text" ? q.correct_text_answer : null,
          options:
            q.question_type !== "text"
              ? q.options.filter((o) => o.option_text.trim()).map((o) => ({
                  option_text: o.option_text.trim(),
                  is_correct: o.is_correct,
                }))
              : [],
        })),
      }
      await axios.post("/api/admin/assignments/update", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      router.push("/admin/assignments")
    } catch (error) {
      console.error("Update assignment error:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to save assignment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await axios.post(
        "/api/admin/assignments/delete",
        { assignment_id: Number(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      router.push("/admin/assignments")
    } catch (error) {
      console.error("Delete assignment error:", error)
      setSubmitError(error.response?.data?.message || "Failed to delete assignment")
      setIsDeleteOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Edit Assignment - Admin Panel</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800 flex items-center gap-2">
          <span
            className="text-slate-400 cursor-pointer hover:text-slate-600"
            onClick={() => router.push("/admin/assignments")}
          >
            ←
          </span>
          <span className="text-slate-400 font-normal">Assignment</span>
          <span className="text-slate-800 font-medium">
            {isPageLoading ? "..." : questions[0]?.question_text || assignmentTitle}
          </span>
        </h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] h-11 px-8 rounded-md font-medium text-[15px]"
            onClick={() => router.push("/admin/assignments")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || isPageLoading || loading || !token}
            className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px] disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {pageError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{pageError}</p>
        </div>
      )}
      {submitError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{submitError}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
        {isPageLoading ? (
          <div className="text-slate-500 text-center py-12">Loading assignment...</div>
        ) : (
          <>
            {/* Cascaded Selectors */}
            <div className="mb-8">
              <div className="mb-6">
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">
                  Course
                </Label>
                <div className="relative w-full max-w-[425px]">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full h-12 border border-slate-300 rounded-md px-3 pr-10 text-[15px] text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#2F5FAC]/30 focus:border-[#2F5FAC]"
                  >
                    <option value="">Select course</option>
                    {coursesTree.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <Label className="mb-2 block text-slate-700 font-medium text-[15px]">
                    Lesson
                  </Label>
                  <div className="relative">
                    <select
                      value={selectedLessonId}
                      onChange={(e) => handleLessonChange(e.target.value)}
                      disabled={!selectedCourseId}
                      className="w-full h-12 border border-slate-300 rounded-md px-3 pr-10 text-[15px] text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#2F5FAC]/30 focus:border-[#2F5FAC] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select lesson</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-slate-700 font-medium text-[15px]">
                    Sub-lesson
                  </Label>
                  <div className="relative">
                    <select
                      value={selectedSubLessonId}
                      onChange={(e) => setSelectedSubLessonId(e.target.value)}
                      disabled={!selectedLessonId}
                      className="w-full h-12 border border-slate-300 rounded-md px-3 pr-10 text-[15px] text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#2F5FAC]/30 focus:border-[#2F5FAC] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select sub-lesson</option>
                      {subLessons.map((sl) => (
                        <option key={sl.id} value={sl.id}>
                          {sl.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.subLesson && !selectedSubLessonId && (
                    <p className="text-orange-500 text-sm mt-1">{errors.subLesson}</p>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-slate-200 mb-8" />

            {/* Questions Section */}
            <div>
              <h2 className="text-[17px] font-semibold text-[#2F5FAC] mb-6">
                Assignment detail
              </h2>

              {errors.questions && (
                <p className="text-orange-500 text-sm mb-4">{errors.questions}</p>
              )}

              <div className="space-y-8">
                {questions.map((q, qIdx) => (
                  <div
                    key={q._id}
                    className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 relative"
                  >
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="mb-4">
                      <Label className="mb-2 block text-slate-700 font-medium text-[15px]">
                        Assignment <span className="text-[#C82A2A]">*</span>
                      </Label>
                      <Input
                        value={q.question_text}
                        onChange={(e) =>
                          updateQuestion(qIdx, "question_text", e.target.value)
                        }
                        placeholder="Enter your question here"
                        className={`h-12 border-slate-300 text-[15px] bg-white ${
                          errors[`q_${qIdx}_text`] ? "border-orange-500" : ""
                        }`}
                      />
                      {errors[`q_${qIdx}_text`] && (
                        <p className="text-orange-500 text-sm mt-1">
                          {errors[`q_${qIdx}_text`]}
                        </p>
                      )}
                    </div>

                    <div className="mb-5">
                      <Label className="mb-3 block text-slate-700 font-medium text-[15px]">
                        Question type
                      </Label>
                      <RadioGroup
                        value={q.question_type}
                        onValueChange={(val) =>
                          updateQuestion(qIdx, "question_type", val)
                        }
                        className="flex flex-wrap gap-6"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <div key={t.value} className="flex items-center gap-2">
                            <RadioGroupItem
                              value={t.value}
                              id={`type-${q._id}-${t.value}`}
                              className="w-4 h-4 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]"
                            />
                            <Label
                              htmlFor={`type-${q._id}-${t.value}`}
                              className="text-slate-700 text-[14px] font-normal cursor-pointer"
                            >
                              {t.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {q.question_type === "text" && (
                      <div>
                        <Label className="mb-2 block text-slate-600 text-[14px] font-medium">
                          Correct answer (for reference)
                        </Label>
                        <Textarea
                          value={q.correct_text_answer}
                          onChange={(e) =>
                            updateQuestion(qIdx, "correct_text_answer", e.target.value)
                          }
                          placeholder="Enter expected correct answer"
                          className="min-h-[88px] border-slate-300 text-[14px] bg-white resize-y"
                          rows={3}
                        />
                      </div>
                    )}

                    {(q.question_type === "single_choice" ||
                      q.question_type === "multiple_choice") && (
                      <div>
                        <Label className="mb-3 block text-slate-600 text-[14px] font-medium">
                          Options{" "}
                          <span className="text-slate-400 font-normal text-[13px]">
                            (tick ✓ = correct answer
                            {q.question_type === "single_choice"
                              ? ", pick one"
                              : ", pick all correct"}
                            )
                          </span>
                        </Label>
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={opt._id} className="flex items-center gap-3">
                              <input
                                type={
                                  q.question_type === "single_choice"
                                    ? "radio"
                                    : "checkbox"
                                }
                                checked={opt.is_correct}
                                onChange={(e) =>
                                  updateOption(qIdx, oIdx, "is_correct", e.target.checked)
                                }
                                className="w-4 h-4 text-[#2F5FAC] border-slate-300 flex-shrink-0"
                                name={
                                  q.question_type === "single_choice"
                                    ? `q-${q._id}-correct`
                                    : undefined
                                }
                              />
                              <Input
                                value={opt.option_text}
                                onChange={(e) =>
                                  updateOption(qIdx, oIdx, "option_text", e.target.value)
                                }
                                placeholder={`Option ${oIdx + 1}`}
                                className="h-10 border-slate-300 text-[14px] bg-white flex-1"
                              />
                              {q.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(qIdx, oIdx)}
                                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addOption(qIdx)}
                          className="mt-3 flex items-center gap-1.5 text-[#2F5FAC] text-[13px] font-medium hover:text-[#254A8A] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add option
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setQuestions((prev) => [...prev, createEmptyQuestion()])
                }
                className="mt-6 flex items-center gap-2 text-[#2F5FAC] font-medium text-[15px] hover:text-[#254A8A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete button */}
      {!isPageLoading && (
        <div className="flex justify-end mb-12">
          <Button
            variant="ghost"
            className="text-[#2F5FAC] hover:bg-blue-50 hover:text-[#1E3A8A] font-medium"
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete Assignment
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? All questions and options will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
