import Head from "next/head"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

export default function AddAssignment() {
  const router = useRouter()
  const { token, loading, logout } = useAuth()

  const [coursesTree, setCoursesTree] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedLessonId, setSelectedLessonId] = useState("")
  const [selectedSubLessonId, setSelectedSubLessonId] = useState("")

  const [questions, setQuestions] = useState([createEmptyQuestion()])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !token) router.push("/admin/login")
  }, [loading, token, router])

  useEffect(() => {
    if (!token) return
    axios
      .get("/api/admin/assignments/courses-tree", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCoursesTree(res.data.courses || []))
      .catch((err) => console.error("Fetch courses tree error:", err))
  }, [token])

  const selectedCourse = coursesTree.find((c) => String(c.id) === String(selectedCourseId))
  const lessons = selectedCourse?.lessons || []
  const selectedLesson = lessons.find((l) => String(l.id) === String(selectedLessonId))
  const subLessons = selectedLesson?.sub_lessons || []

  // Reset cascades
  const handleCourseChange = (val) => {
    setSelectedCourseId(val)
    setSelectedLessonId("")
    setSelectedSubLessonId("")
  }
  const handleLessonChange = (val) => {
    setSelectedLessonId(val)
    setSelectedSubLessonId("")
  }

  // Question helpers
  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx
          ? {
              ...q,
              [field]: value,
              // Reset options/answer when type changes
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
            // For single_choice, uncheck others when one is checked
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
      if (!q.question_text.trim()) {
        newErrors[`q_${i}_text`] = "Question text is required"
      }
    })
    return newErrors
  }

  const handleCreate = async () => {
    setSubmitError("")
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
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
      await axios.post("/api/admin/assignments/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      router.push("/admin/assignments")
    } catch (error) {
      console.error("Create assignment error:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to create assignment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Add Assignment - Admin Panel</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800">Add Assignment</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] h-11 px-8 rounded-md font-medium text-[15px]"
            onClick={() => router.push("/admin/assignments")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSubmitting || loading || !token}
            className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px] disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{submitError}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
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
                <option value="">Place Holder</option>
                {coursesTree.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.subLesson && !selectedCourseId && (
              <p className="text-orange-500 text-sm mt-1">Please select a course</p>
            )}
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
                  <option value="">Place Holder</option>
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
                  <option value="">Place Holder</option>
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
          <h2 className="text-[17px] font-semibold text-[#2F5FAC] mb-6">Assignment detail</h2>

          {errors.questions && (
            <p className="text-orange-500 text-sm mb-4">{errors.questions}</p>
          )}

          <div className="space-y-8">
            {questions.map((q, qIdx) => (
              <div
                key={q._id}
                className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 relative"
              >
                {/* Remove question button */}
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
                    onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)}
                    placeholder="Enter your question here"
                    className={`h-12 border-slate-300 text-[15px] bg-white ${
                      errors[`q_${qIdx}_text`] ? "border-orange-500" : ""
                    }`}
                  />
                  {errors[`q_${qIdx}_text`] && (
                    <p className="text-orange-500 text-sm mt-1">{errors[`q_${qIdx}_text`]}</p>
                  )}
                </div>

                {/* Question Type */}
                <div className="mb-5">
                  <Label className="mb-3 block text-slate-700 font-medium text-[15px]">
                    Question type
                  </Label>
                  <RadioGroup
                    value={q.question_type}
                    onValueChange={(val) => updateQuestion(qIdx, "question_type", val)}
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

                {/* Text answer */}
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

                {/* Choice options */}
                {(q.question_type === "single_choice" ||
                  q.question_type === "multiple_choice") && (
                  <div>
                    <Label className="mb-3 block text-slate-600 text-[14px] font-medium">
                      Options{" "}
                      <span className="text-slate-400 font-normal text-[13px]">
                        (tick ✓ = correct answer
                        {q.question_type === "single_choice" ? ", pick one" : ", pick all correct"})
                      </span>
                    </Label>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt._id} className="flex items-center gap-3">
                          <input
                            type={
                              q.question_type === "single_choice" ? "radio" : "checkbox"
                            }
                            checked={opt.is_correct}
                            onChange={(e) =>
                              updateOption(qIdx, oIdx, "is_correct", e.target.checked)
                            }
                            className="w-4 h-4 text-[#2F5FAC] border-slate-300 flex-shrink-0"
                            name={q.question_type === "single_choice" ? `q-${q._id}-correct` : undefined}
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
            onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}
            className="mt-6 flex items-center gap-2 text-[#2F5FAC] font-medium text-[15px] hover:text-[#254A8A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
