import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import axios from "axios"
import { useAuth } from "@/features/auth/context/AuthContext"
import { useRouter } from "next/router"

export default function AdminCourseActions({ courseId, courseName }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { token, logout } = useAuth()
  const router = useRouter()

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`/api/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Redirect to refresh the page or update state
      setDeleteDialogOpen(false)
      // You could add a toast notification here
      // For now, we'll redirect to refresh the course list
      router.push(router.asPath)
    } catch (error) {
      console.error("Delete course error:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout()
      }
      // You could add toast notification here
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }

  const handleEditClick = () => {
    router.push(`/admin/courses/${courseId}`)
  }

  return (
    <>
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="text-[#2F5FAC] border-[#2F5FAC] hover:bg-blue-50 hover:text-[#1E3A8A] text-sm"
          onClick={handleEditClick}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
          onClick={handleDeleteClick}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{courseName}"? This action cannot be undone and will permanently remove the course and all its lessons.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
