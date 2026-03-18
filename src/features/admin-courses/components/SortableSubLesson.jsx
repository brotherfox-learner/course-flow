import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Edit } from "lucide-react";

export default function SortableSubLesson({ sub, lessonId, onDelete, onEdit }) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `sub-${sub.id}`,
    data: {
      type: "sublesson",
      lessonId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-6 rounded-2xl border border-gray-200 bg-white"
    >

      <div
        {...attributes}
        {...listeners}
        className="grid grid-cols-2 gap-1 py-6 px-6 cursor-grab"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-1 h-1 bg-slate-300 rounded-full"
          />
        ))}
      </div>
      <div className="flex items-center gap-4 flex-1">
        <span className="text-slate-600 font-medium">
          {sub.order_index}
        </span>
        <span>{sub.name}</span>
      </div>

      <div className="flex items-center gap-2 pr-4">
        <button
          type="button"
          onClick={() => onDelete && onDelete(sub.id)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit && onEdit(sub)}
          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
        >
          <Edit className="h-4 w-4" />
        </button>
      </div>

    </li>
  );
}