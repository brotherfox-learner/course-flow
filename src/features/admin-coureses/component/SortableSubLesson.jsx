import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableSubLesson({ sub, lessonId }) {

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
      className="flex items-center rounded-2xl border border-gray-200 bg-white"
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

      <span>{sub.name}</span>

    </li>
  );
}