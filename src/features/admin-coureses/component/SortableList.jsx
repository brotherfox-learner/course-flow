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

  console.log("lessons:", lessons);

  if (!mounted) return null;

  function extractId(id) {
    return id.split("-")[1];
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

          const updatedSubLessons = reordered.map((sub, index) => ({
            ...sub,
            order_index: index + 1,
          }));

          console.table(updatedSubLessons);

          return {
            ...lesson,
            sub_lessons: updatedSubLessons,
          };
        })
      );

      return;
    }

    // LESSON DRAG
    setLessons((prev) => {
      const oldIndex = prev.findIndex(
        (lesson) => lesson.id === extractId(active.id)
      );

      const newIndex = prev.findIndex(
        (lesson) => lesson.id === extractId(over.id)
      );

      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = arrayMove(prev, oldIndex, newIndex);

      const updatedLessons = reordered.map((lesson, index) => ({
        ...lesson,
        order_index: index + 1,
      }));

      console.table(updatedLessons);

      return updatedLessons;
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
                <SortableLesson key={item.id} item={item} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}