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

import Button from "@/common/navbar/Button";
import { useToggle } from "@/hooks/useToggle";
import SortableSubLesson from "./SortableSubLesson";

export default function SortableLesson({ item, onDelete, onEdit, onAddSubLesson, onDeleteSubLesson, onEditSubLesson, onSubLessonReorder }) {

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

        const oldIndex = item.sub_lessons.findIndex((s) => Number(s.id) === activeSubId);
        const newIndex = item.sub_lessons.findIndex((s) => Number(s.id) === overSubId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(item.sub_lessons, oldIndex, newIndex);
        const updatedSubLessons = reordered.map((sub, index) => ({
            ...sub,
            order_index: index + 1,
        }));

        if (onSubLessonReorder) {
            onSubLessonReorder(item.id, updatedSubLessons);
        }
    }

    return (
        <div className="py-8 border-b border-gray-200">

            <li
                ref={setNodeRef}
                style={style}
                className="grid grid-cols-12 items-center bg-white"
            >

                {/* drag handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="col-span-1 flex justify-center cursor-grab"
                >
                    <div className="grid grid-cols-2 gap-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-1 h-1 bg-slate-300 rounded-full"
                            />
                        ))}
                    </div>
                </div>

                {/* lesson name */}
                <div className="col-span-6 flex items-center gap-4">
                    <span className="text-slate-600 font-medium">
                        {item.order_index}
                    </span>
                    <span>{item.name}</span>
                </div>

                {/* sub lesson count */}
                <div className="col-span-3 text-slate-600">
                    {(item.sub_lessons || []).length}
                </div>

                {/* action */}
                <div className="col-span-2 flex justify-center gap-3">

                    <Button
                        iconOnly
                        onClick={() => onDelete && onDelete(item.id)}
                        className="h-9 w-9 text-blue-300 cursor-pointer hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-full"
                    >
                        <Trash2 className="h-[18px] w-[18px]" />
                    </Button>

                    <Button
                        iconOnly
                        onClick={() => onEdit && onEdit(item)}
                        className="h-9 w-9 text-blue-300 cursor-pointer hover:text-blue-500 hover:bg-blue-50 active:bg-blue-100 rounded-full"
                    >
                        <Edit className="h-[18px] w-[18px]" />
                    </Button>

                    <Button iconOnly onClick={switchToggle} className="h-9 w-9 cursor-pointer hover:bg-gray-50 active:bg-gray-200 rounded-full">
                        {!isShow
                            ? <ChevronDown className="h-[18px] w-[18px]" />
                            : <ChevronUp className="h-[18px] w-[18px]" />}
                    </Button>

                </div>

            </li>

            {isShow && (
                <DndContext
                    sensors={subSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSubDragEnd}
                >
                    <SortableContext
                        items={item.sub_lessons.map((s) => `sub-${s.id}`)}
                        strategy={verticalListSortingStrategy}
                    >

                        <ul className="space-y-2 px-15 pt-8">

                            {item.sub_lessons.map((sub) => (
                                <SortableSubLesson
                                    key={sub.id}
                                    sub={sub}
                                    lessonId={item.id}
                                    onDelete={onDeleteSubLesson}
                                    onEdit={onEditSubLesson}
                                />
                            ))}

                            <li className="flex justify-center py-2">
                                <button
                                    type="button"
                                    onClick={() => onAddSubLesson && onAddSubLesson(item.id)}
                                    className="text-[#2F5FAC] text-sm font-medium hover:underline"
                                >
                                    + Add Sub-Lesson
                                </button>
                            </li>

                        </ul>

                    </SortableContext>
                </DndContext>
            )}

        </div>
    );
}