import { useState, useEffect } from "react";
import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

import SortableLesson from "./SortableLesson";

export default function SortableList({ lessons, setLessons }) {
    const [mounted, setMounted] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    function extractId(id) {
        return Number(id.split("-")[1]);
    }

    function handleDragEnd(event) {
        const { active, over } = event;

        if (!over) return;
        if (active.id === over.id) return;

        const activeLesson = active.data.current?.lessonId;
        const overLesson = over.data.current?.lessonId;

        // SUB LESSON DRAG
        if (activeLesson) {

            if (activeLesson !== overLesson) return;

            setLessons((prev) =>
                prev.map((lesson) => {

                    if (lesson.id !== activeLesson) return lesson;

                    const oldIndex = lesson.sub_lessons.findIndex(
                        (s) => s.id === extractId(active.id)
                    );

                    const newIndex = lesson.sub_lessons.findIndex(
                        (s) => s.id === extractId(over.id)
                    );

                    const reordered = arrayMove(
                        lesson.sub_lessons,
                        oldIndex,
                        newIndex
                    );

                    return {
                        ...lesson,
                        sub_lessons: reordered.map((sub, index) => ({
                            ...sub,
                            order_index: index + 1
                        }))
                    };
                })
            );

            return;
        }

        // LESSON DRAG
        setItems((prev) => {

            const oldIndex = prev.findIndex(
                (lesson) => lesson.id === extractId(active.id)
            );

            const newIndex = prev.findIndex(
                (lesson) => lesson.id === extractId(over.id)
            );

            const reordered = arrayMove(prev, oldIndex, newIndex);

            return reordered.map((lesson, index) => ({
                ...lesson,
                order_index: index + 1
            }));
        });
    }

    return (
        <div className="flex justify-center">
            <div className="w-full">

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >

                    <SortableContext
                        items={lessons.map((item) => `lesson-${item.id}`)}
                        strategy={verticalListSortingStrategy}
                    >

                        <ul>
                            {lessons.map((item) => (
                                <SortableLesson
                                    key={item.id}
                                    item={item}
                                />
                            ))}
                        </ul>

                    </SortableContext>

                </DndContext>

            </div>
        </div>
    );
}