import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";

import Button from "@/shared/components/navbar/Button";
import { useToggle } from "@/shared/hooks/useToggle";
import SortableSubLesson from "./SortableSubLesson";

export default function SortableLesson({ item, onDelete, onEdit, onAddSubLesson, onDeleteSubLesson, onSubLessonReorder }) {

    const { isShow, switchToggle } = useToggle();

    const subSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor)
    );

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `lesson-${item.id}`,
        data: {
            type: "lesson",
            lessonId: item.id
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    function handleSubDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeSubId = Number(String(active.id).split("-")[1]);
        const overSubId = Number(String(over.id).split("-")[1]);

        const oldIndex = (item.subLessons || []).findIndex((s) => Number(s.id) === activeSubId);
        const newIndex = (item.subLessons || []).findIndex((s) => Number(s.id) === overSubId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(item.subLessons || [], oldIndex, newIndex);
        const updatedSubLessons = reordered.map((sub, index) => ({
            ...sub,
            order_index: index + 1,
        }));

        if (onSubLessonReorder) {
            onSubLessonReorder(item.id, updatedSubLessons);
        }
    }

    return (
        <div className="flex flex-col">
            {/* Lesson Row */}
            <div
                ref={setNodeRef}
                style={style}
                className="flex h-[88px] bg-white border-b border-[#F1F2F6] hover:bg-gray-50"
            >
                {/* drag handle */}
                <div className="w-[56px] flex-shrink-0 flex justify-center items-center">
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
                </div>

                {/* order */}
                <div className="w-[48px] flex-shrink-0 flex justify-center items-center">
                    <span className="text-base text-black">{item.order_index}</span>
                </div>

                {/* lesson name */}
                <div className="flex-1 flex items-center px-4">
                    <span className="text-base text-black">{item.name}</span>
                </div>

                {/* sub lesson count */}
                <div className="w-[396px] flex-shrink-0 flex items-center px-4">
                    <span className="text-base text-black">{(item.subLessons || []).length}</span>
                </div>

                {/* action */}
                <div className="w-[120px] flex-shrink-0 flex justify-center items-center gap-4">
                    <button
                        type="button"
                        onClick={() => onDelete && onDelete(item.id)}
                        className="text-[#8DADE0] hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="h-6 w-6" />
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit && onEdit(item)}
                        className="text-[#8DADE0] hover:text-blue-500 transition-colors"
                    >
                        <Edit className="h-6 w-6" />
                    </button>

                    <button
                        type="button"
                        onClick={switchToggle}
                        className="text-[#8DADE0] hover:text-gray-600 transition-colors"
                    >
                        {!isShow
                            ? <ChevronDown className="h-6 w-6" />
                            : <ChevronUp className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Sub-lessons expansion */}
            {isShow && (
                <div className="bg-gray-50 p-4 border-b border-[#F1F2F6]">
                    <DndContext
                        sensors={subSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleSubDragEnd}
                    >
                        <SortableContext
                            items={(item.subLessons || []).map((s) => `sub-${s.id}`)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {(item.subLessons || []).map((sub) => (
                                    <SortableSubLesson
                                        key={sub.id}
                                        sub={sub}
                                        lessonId={item.id}
                                        onDelete={onDeleteSubLesson}
                                    />
                                ))}
                                <div className="flex justify-center py-2">
                                    <button
                                        type="button"
                                        onClick={() => onAddSubLesson && onAddSubLesson(item.id)}
                                        className="text-[#2F5FAC] text-sm font-medium hover:underline"
                                    >
                                        + Add Sub-Lesson
                                    </button>
                                </div>
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
}