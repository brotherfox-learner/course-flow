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
import useDeleteLesson from "@/features/admin-coureses/hook/useDeleteLesson"
import Modal from "@/common/modal";

export default function SortableList({
  lessons,
  setLessons,
  courseId,
  token
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const { deleteLesson, loading } = useDeleteLesson()
  const [mounted, setMounted] = useState(false);

  function openDeleteModal(lessonId) {
    setSelectedLesson(lessonId)
    setIsDeleteOpen(true)
  }

  async function handleDeleteLesson() {

    if (!selectedLesson) return

    const ok = await deleteLesson(selectedLesson)

    if (!ok) return

    setLessons(prev => prev.filter(l => l.id !== selectedLesson))

    setIsDeleteOpen(false)
    setSelectedLesson(null)

  }

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

  async function handleDragEnd(event) {

    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    const type = active.data.current?.type;

    /*
    ================================
    SUB LESSON DRAG
    ================================
    */

    if (type === "sublesson") {

      const lessonId = active.data.current.lessonId;

      let updatedSubLessons = [];

      setLessons((prev) => {

        const updatedLessons = prev.map((lesson) => {

          if (lesson.id !== lessonId) return lesson;

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

          updatedSubLessons = reordered.map((sub, index) => ({
            ...sub,
            order_index: index + 1
          }));

          return {
            ...lesson,
            sub_lessons: updatedSubLessons
          };

        });

        return updatedLessons;

      });

      /*
      ยิง API update sublesson order
      */

      try {

        await fetch("/api/admin/sub-lessons/reorder", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            lesson_id: lessonId,
            sub_lesson_orders: updatedSubLessons.map((s) => ({
              id: s.id,
              order_index: s.order_index
            }))
          })
        });

      } catch (err) {

        console.error("Sublesson reorder failed:", err);

      }

      return;

    }

    /*
    ================================
    LESSON DRAG
    ================================
    */

    if (type === "lesson") {

      let updatedLessons = [];

      setLessons((prev) => {

        const oldIndex = prev.findIndex(
          (lesson) => lesson.id === extractId(active.id)
        );

        const newIndex = prev.findIndex(
          (lesson) => lesson.id === extractId(over.id)
        );

        const reordered = arrayMove(prev, oldIndex, newIndex);

        updatedLessons = reordered.map((lesson, index) => ({
          ...lesson,
          order_index: index + 1
        }));

        return updatedLessons;

      });

      /*
      ยิง API update lesson order
      */

      try {

        await fetch("/api/admin/lessons/reorder", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            course_id: courseId,
            lesson_orders: updatedLessons.map((l) => ({
              id: l.id,
              order_index: l.order_index
            }))
          })
        });

      } catch (err) {

        console.error("Lesson reorder failed:", err);

      }

    }

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
                  onDelete={openDeleteModal}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        message="Are you sure you want to delete this lesson?"
        primaryLabel="No, keep it"
        secondaryLabel={loading ? "Deleting..." : "Yes, I want to delete this lesson"}
        onSecondaryClick={handleDeleteLesson}
      />
    </div>

  );
}