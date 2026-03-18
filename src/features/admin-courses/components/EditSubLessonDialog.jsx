import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"

/**
 * Modal dialog for editing an existing sub-lesson.
 */
export default function EditSubLessonDialog({
  isOpen,
  name,
  vdoUrl,
  vdoTime,
  onNameChange,
  onVdoUrlChange,
  onVdoTimeChange,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
        <h3 className="text-lg font-medium mb-4">Edit Sub-Lesson</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Sub-lesson name</Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Sub-lesson name"
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
            />
          </div>
          <div>
            <Label className="mb-1 block body2 text-black font-normal">Video URL (Optional)</Label>
            <Input
              value={vdoUrl}
              onChange={(e) => onVdoUrlChange(e.target.value)}
              placeholder="https://..."
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
            />
          </div>
          <div>
            <Label className="mb-1 block body2 text-black font-normal">
              Video Duration in minutes (Optional)
            </Label>
            <Input
              type="number"
              value={vdoTime}
              onChange={(e) => onVdoTimeChange(e.target.value)}
              placeholder="10"
              className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="cancel" size="admin" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="admin" onClick={onConfirm}>Save</Button>
        </div>
      </div>
    </div>
  )
}
