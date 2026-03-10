import { useState } from "react"
import { X } from "lucide-react"
import Button from "@/common/navbar/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddLessonModal({ open, onClose, onSuccess, courseId, token }) {
  const [lessonName, setLessonName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose?.()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!lessonName.trim()) {
      setError("Lesson name is required")
      return
    }
    if (!courseId || !token) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/lessons/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: Number(courseId),
          name: lessonName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create lesson")
      }

      onSuccess?.(data.lesson)
      setLessonName("")
      onClose?.()
    } catch (err) {
      setError(err.message || "Failed to create lesson")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setLessonName("")
      setError("")
      onClose?.()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <section
        className="relative w-full max-w-[343px] lg:max-w-[520px] rounded-[16px] bg-white shadow-[2px_2px_12px_0px_rgba(64,50,133,0.12)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex w-full h-[56px] items-center justify-between border-b border-gray-200 py-[8px] px-[16px]">
          <h2 className="text-[20px] font-normal leading-[150%] text-gray-900">
            Add Lesson
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="lesson-name" className="mb-2 block text-slate-700 font-medium text-[15px]">
              Lesson name <span className="text-[#C82A2A]">*</span>
            </Label>
            <Input
              id="lesson-name"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="Enter lesson name"
              className="h-12 border-slate-300 text-[15px]"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-orange-500 text-sm">{error}</p>
          )}

          <footer className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 h-12"
            >
              {isSubmitting ? "Adding..." : "Add Lesson"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  )
}
