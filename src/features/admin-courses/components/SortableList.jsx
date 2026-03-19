import { useState, useEffect } from "react";

import axios from "axios";

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



export default function SortableList({ lessons, setLessons, courseId, token, onDeleteLesson, onEditLesson, onAddSubLesson, onDeleteSubLesson }) {

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



  function extractId(compositeId) {

    const parts = String(compositeId).split("-");

    return Number(parts[1]);

  }



  async function handleLessonDragEnd(event) {

    const { active, over } = event;

    if (!over || active.id === over.id) return;



    const activeLessonId = extractId(active.id);

    const overLessonId = extractId(over.id);



    const oldIndex = lessons.findIndex((l) => Number(l.id) === activeLessonId);

    const newIndex = lessons.findIndex((l) => Number(l.id) === overLessonId);

    if (oldIndex === -1 || newIndex === -1) return;



    const reordered = arrayMove(lessons, oldIndex, newIndex);

    const updatedLessons = reordered.map((lesson, index) => ({

      ...lesson,

      order_index: index + 1,

    }));

    const updatedOrders = updatedLessons.map((l) => ({ id: Number(l.id), order_index: l.order_index }));



    setLessons(updatedLessons);



    if (token && courseId) {

      try {

        await axios.post(

          "/api/admin/lessons/reorder",

          { course_id: Number(courseId), lesson_orders: updatedOrders },

          { headers: { Authorization: `Bearer ${token}` } }

        );

      } catch (err) {

        console.error("Lesson reorder API failed:", err);

      }

    }

  }



  async function handleSubLessonReorder(lessonId, updatedSubLessons) {

    const updatedOrders = updatedSubLessons.map((s) => ({ id: Number(s.id), order_index: s.order_index }));



    setLessons((prev) =>

      prev.map((lesson) =>

        Number(lesson.id) === Number(lessonId)

          ? { ...lesson, subLessons: updatedSubLessons }

          : lesson

      )

    );



    if (token) {

      try {

        await axios.post(

          "/api/admin/sub-lessons/reorder",

          { lesson_id: Number(lessonId), sub_lesson_orders: updatedOrders },

          { headers: { Authorization: `Bearer ${token}` } }

        );

      } catch (err) {

        console.error("Sub-lesson reorder API failed:", err);

      }

    }

  }



  return (
    <div className="flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleLessonDragEnd}
      >
        <SortableContext
          items={lessons.map((item) => `lesson-${item.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {lessons.map((item) => (
            <SortableLesson
              key={item.id}
              item={item}
              onDelete={onDeleteLesson}
              onEdit={onEditLesson}
              onAddSubLesson={onAddSubLesson}
                onDeleteSubLesson={onDeleteSubLesson}
              onSubLessonReorder={handleSubLessonReorder}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );

}