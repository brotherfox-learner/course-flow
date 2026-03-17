import { useState } from "react"
import axios from "axios"

/**
 * Manages the Add / Edit sub-lesson modal state and their async API handlers.
 * Used exclusively by the course edit page ([id]/index.jsx).
 *
 * @param {string|null} token
 * @param {Function} onRefreshLessons - refetch lessons after mutation
 * @param {Function} onError - called with error message string
 */
export function useSubLessonModals(token, onRefreshLessons, onError) {
  // ── Add sub-lesson ────────────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [newName, setNewName] = useState("")
  const [newVdoUrl, setNewVdoUrl] = useState("")
  const [newVdoTime, setNewVdoTime] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const openAdd = (lessonId) => {
    setActiveLessonId(lessonId)
    setNewName("")
    setNewVdoUrl("")
    setNewVdoTime("")
    setIsAddOpen(true)
  }

  const closeAdd = () => {
    setIsAddOpen(false)
    setActiveLessonId(null)
  }

  const handleAdd = async () => {
    if (!activeLessonId || !newName.trim()) return
    setIsSaving(true)
    try {
      await axios.post(
        "/api/admin/sub-lessons/create",
        {
          lesson_id: activeLessonId,
          name: newName.trim(),
          vdo_url: newVdoUrl || null,
          vdo_time: newVdoTime ? Number(newVdoTime) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      closeAdd()
      await onRefreshLessons?.()
    } catch (err) {
      onError?.(err.response?.data?.message || "Failed to add sub-lesson")
    } finally {
      setIsSaving(false)
    }
  }

  // ── Edit sub-lesson ───────────────────────────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editVdoUrl, setEditVdoUrl] = useState("")
  const [editVdoTime, setEditVdoTime] = useState("")

  const openEdit = (subLesson) => {
    setEditId(subLesson.id)
    setEditName(subLesson.name || "")
    setEditVdoUrl(subLesson.vdo_url || "")
    setEditVdoTime(subLesson.vdo_time != null ? String(subLesson.vdo_time) : "")
    setIsEditOpen(true)
  }

  const closeEdit = () => setIsEditOpen(false)

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return
    try {
      await axios.post(
        "/api/admin/sub-lessons/update",
        {
          sub_lesson_id: editId,
          name: editName.trim(),
          vdo_url: editVdoUrl || null,
          vdo_time: editVdoTime ? Number(editVdoTime) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      closeEdit()
      await onRefreshLessons?.()
    } catch (err) {
      onError?.(err.response?.data?.message || "Failed to update sub-lesson")
    }
  }

  // ── Delete sub-lesson ─────────────────────────────────────────────────────
  const handleDelete = async (subLessonId) => {
    if (!window.confirm("Delete this sub-lesson?")) return
    try {
      await axios.post(
        "/api/admin/sub-lessons/delete",
        { sub_lesson_id: subLessonId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await onRefreshLessons?.()
    } catch (err) {
      onError?.(err.response?.data?.message || "Failed to delete sub-lesson")
    }
  }

  return {
    // Add
    isAddOpen,
    newName, setNewName,
    newVdoUrl, setNewVdoUrl,
    newVdoTime, setNewVdoTime,
    isSaving,
    openAdd,
    closeAdd,
    handleAdd,
    // Edit
    isEditOpen,
    editName, setEditName,
    editVdoUrl, setEditVdoUrl,
    editVdoTime, setEditVdoTime,
    openEdit,
    closeEdit,
    handleUpdate,
    // Delete
    handleDelete,
  }
}
