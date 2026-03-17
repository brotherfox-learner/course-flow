/**
 * Shared assignment status utilities.
 * Used by features/assignments and features/course-learning.
 */

export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "text-[#996500] bg-[#FFFBDB] px-2 py-1 rounded-[4px]",
    color: "text-[#996500] bg-[#FFFBDB] px-[8px] py-[4px] rounded-[4px]",
  },
  inprogress: {
    label: "In progress",
    className: "text-[#3557CF] bg-[#EBF0FF] px-2 py-1 rounded-[4px]",
    color: "text-[#3557CF] bg-[#EBF0FF] px-[8px] py-[4px] rounded-[4px]",
  },
  draft: {
    label: "Draft",
    className: "text-slate-500",
    color: "text-slate-500",
  },
  submitted: {
    label: "Submitted",
    className: "text-green-600 bg-green-50 px-2 py-1 rounded-[4px]",
    color: "text-green-600",
  },
  graded: {
    label: "Graded",
    className: "text-blue-600 bg-blue-50 px-2 py-1 rounded-[4px]",
    color: "text-blue-600",
  },
}

/**
 * Get display config for a status key (uses className field).
 * Used in CourseContent-style components.
 */
export function getStatusDisplay(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending
}

/**
 * Derive the current status key from an assignment row.
 * Used in my-assignments list view.
 */
export function getDisplayStatus(a) {
  const sid = a?.submission_id ?? a?.submissionId
  if (sid == null || sid === "" || sid === 0) return "pending"
  const status = (a?.submission_status ?? a?.submissionStatus ?? "").toLowerCase()
  return status || "pending"
}

/**
 * Get display config with color field for a status key.
 * Used in AssignmentCard list view.
 */
export function getStatusConfig(statusKey) {
  const entry = STATUS_CONFIG[statusKey]
  if (entry) return entry
  return {
    label: statusKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "text-gray-600",
    className: "text-gray-600",
  }
}

/**
 * Returns true if the assignment is still in progress (not yet submitted).
 * Used for tab filtering.
 */
export function isInProgress(a) {
  const sid = a?.submission_id ?? a?.submissionId
  if (sid == null || sid === "" || sid === 0) return true
  const status = (a?.submission_status ?? a?.submissionStatus ?? "").toLowerCase()
  return status === "pending" || status === "inprogress"
}

/**
 * Build grading state from an existing submission.
 * Shared between CourseContent and AssignmentCard.
 */
export function buildGradingFromExisting(questions, initAnswers, submissionStatus) {
  if (submissionStatus === "pending") return null

  const grading = {}
  for (const q of questions) {
    const ans = initAnswers[q.id]
    if (!ans) continue

    if (q.question_type === "text") {
      if (!ans.answer_text?.trim()) continue
      grading[q.id] = {
        question_id: q.id,
        question_type: "text",
        is_correct: true,
        correct_text_answer: q.correct_text_answer ?? null,
      }
    } else {
      const selectedIds = (ans.selected_option_ids || []).map(Number)
      if (selectedIds.length === 0) continue

      const options = q.options || []
      const correctIds = options.filter((o) => o.is_correct).map((o) => Number(o.id))

      let is_correct
      if (q.question_type === "single_choice") {
        is_correct = selectedIds.length === 1 && correctIds.includes(selectedIds[0])
      } else {
        is_correct =
          correctIds.every((cid) => selectedIds.includes(cid)) &&
          selectedIds.every((sid) => correctIds.includes(sid))
      }

      if (submissionStatus === "inprogress" && !is_correct) continue

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

  return Object.keys(grading).length > 0 ? grading : null
}
