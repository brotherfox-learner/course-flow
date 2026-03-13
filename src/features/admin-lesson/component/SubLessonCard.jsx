import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import VideoUpload from "@/components/upload/VideoUpload"

export default function SubLessonCard({
  subLesson,
  index,
  onChange,
  onDelete,
  disableDelete,
  disabled,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subLesson.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleNameChange = (e) => {
    onChange({ ...subLesson, name: e.target.value })
  }

  const handleVideoChange = (videoData) => {
    onChange({ ...subLesson, videoData })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-slate-200 rounded-lg p-6 flex items-start gap-4"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex justify-center pt-2 cursor-grab active:cursor-grabbing"
      >
        <div className="grid grid-cols-2 gap-[3px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[4px] h-[4px] bg-slate-300 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Sub-lesson name */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sub-lesson name <span className="text-[#C82A2A]">*</span>
            </label>
            <input
              type="text"
              value={subLesson.name}
              onChange={handleNameChange}
              placeholder="Enter sub-lesson name"
              disabled={disabled}
              className="w-full max-w-[530px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5FAC]/30 focus:border-[#2F5FAC] disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={() => onDelete(subLesson.id)}
            disabled={disableDelete || disabled}
            className="text-[#2F5FAC] text-sm font-medium hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed pt-6"
          >
            Delete
          </button>
        </div>

        {/* Video upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Video <span className="text-[#C82A2A]">*</span>
          </label>
          <VideoUpload
            value={subLesson.videoData}
            onChange={handleVideoChange}
            disabled={disabled}
            compact
          />
        </div>
      </div>
    </div>
  )
}
