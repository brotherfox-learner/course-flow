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
import SubLesson from "./SubLesson";


export default function SortableListSub({
    subLessons,
    setSubLessons
}) {
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


    function handleDragEnd(event) {

        const { active, over } = event

        if (!over) return
        if (active.id === over.id) return

        setSubLessons((prev) => {

            const oldIndex = prev.findIndex(
                (sub) => `sublesson-${sub.id}` === active.id
            )

            const newIndex = prev.findIndex(
                (sub) => `sublesson-${sub.id}` === over.id
            )

            if (oldIndex === -1 || newIndex === -1) return prev

            const reordered = arrayMove(prev, oldIndex, newIndex)

            return reordered.map((sub, index) => ({
                ...sub,
                order_index: index + 1
            }))

        })

    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={subLessons.map((sub) => `sublesson-${sub.id}`)}
                    strategy={verticalListSortingStrategy}
                >

                    {subLessons.map((sub) => (
                        <SubLesson
                            key={sub.id}
                            subLesson={sub}
                            setSubLessons={setSubLessons}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div >

    );
}