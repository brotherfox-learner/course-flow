import { useState, useCallback } from "react"

import { useSortable } from "@dnd-kit/sortable"

import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/shared/ui/button"

import Modal from "@/shared/components/modal"

import SubLessonCard from "./SubLessonCard"

import {

  DndContext,

  PointerSensor,

  KeyboardSensor,

  closestCenter,

  useSensor,

  useSensors,

} from "@dnd-kit/core"

import {

  SortableContext,

  verticalListSortingStrategy,

  arrayMove,

} from "@dnd-kit/sortable"



let nextTempId = 1

function makeTempId() {

  return `temp-sub-${nextTempId++}`

}



export default function LessonBlock({

  lesson,

  index,

  onChange,

  onDelete,

  errors,

  disabled,

}) {

  const {

    attributes,

    listeners,

    setNodeRef,

    transform,

    transition,

    isDragging,

  } = useSortable({ id: lesson.id })



  const style = {

    transform: CSS.Transform.toString(transform),

    transition,

    opacity: isDragging ? 0.5 : 1,

  }



  const [deleteSubTarget, setDeleteSubTarget] = useState(null)

  const [isDeleteLessonOpen, setIsDeleteLessonOpen] = useState(false)



  const sensors = useSensors(

    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),

    useSensor(KeyboardSensor)

  )



  const handleLessonNameChange = (e) => {

    onChange({ ...lesson, name: e.target.value })

  }



  const handleSubLessonChange = useCallback(

    (updated) => {

      onChange({

        ...lesson,

        subLessons: lesson.subLessons.map((s) =>

          s.id === updated.id ? updated : s

        ),

      })

    },

    [lesson, onChange]

  )



  const handleAddSubLesson = () => {

    onChange({

      ...lesson,

      subLessons: [

        ...lesson.subLessons,

        { id: makeTempId(), name: "", content_type: "video", content: null, videoData: null },

      ],

    })

  }



  const confirmDeleteSubLesson = (subId) => {

    if (lesson.subLessons.length <= 1) return

    setDeleteSubTarget(subId)

  }



  const executeDeleteSubLesson = () => {

    if (!deleteSubTarget) return

    onChange({

      ...lesson,

      subLessons: lesson.subLessons.filter((s) => s.id !== deleteSubTarget),

    })

    setDeleteSubTarget(null)

  }



  const handleDragEnd = (event) => {

    const { active, over } = event

    if (!over || active.id === over.id) return



    const oldIndex = lesson.subLessons.findIndex((s) => s.id === active.id)

    const newIndex = lesson.subLessons.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return



    onChange({

      ...lesson,

      subLessons: arrayMove(lesson.subLessons, oldIndex, newIndex),

    })

  }



  return (

    <div

      ref={setNodeRef}

      style={style}

      className="bg-[#F6F7FC] border border-slate-200 rounded-xl p-8 relative"

    >

      {/* Header row: Drag handle + Lesson label + Delete */}

      <div className="flex items-start gap-3 mb-4">

        {/* Drag handle for lesson */}

        <div

          {...attributes}

          {...listeners}

          className="flex justify-center pt-1 cursor-grab active:cursor-grabbing"

        >

          <div className="grid grid-cols-2 gap-[3px]">

            {Array.from({ length: 6 }).map((_, i) => (

              <div

                key={i}

                className="w-[5px] h-[5px] bg-slate-400 rounded-full"

              />

            ))}

          </div>

        </div>

        <h3 className="text-lg font-medium text-slate-800 flex-1">

          Lesson {index + 1}

        </h3>

        <button

          type="button"

          onClick={() => setIsDeleteLessonOpen(true)}

          disabled={disabled}

          className="text-[#2F5FAC] text-sm font-medium hover:text-red-500 transition-colors disabled:opacity-30"

        >

          Delete

        </button>

      </div>



      {/* Lesson name */}

      <div className="mb-6">

        <label className="block text-sm font-medium text-slate-700 mb-1">

          Lesson name <span className="text-[#C82A2A]">*</span>

        </label>

        <input

          type="text"

          value={lesson.name}

          onChange={handleLessonNameChange}

          placeholder="Enter lesson name"

          disabled={disabled}

          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5FAC]/30 focus:border-[#2F5FAC] disabled:opacity-50"

        />

        {errors?.lessonName && (

          <p className="text-orange-500 text-xs mt-1">{errors.lessonName}</p>

        )}

      </div>



      <hr className="border-slate-200 mb-6" />



      {/* Sub-Lesson section */}

      <h4 className="text-sm font-medium text-slate-700 mb-4">Sub-Lesson</h4>



      <DndContext

        sensors={sensors}

        collisionDetection={closestCenter}

        onDragEnd={handleDragEnd}

      >

        <SortableContext

          items={lesson.subLessons.map((s) => s.id)}

          strategy={verticalListSortingStrategy}

        >

          <div className="space-y-4">

            {lesson.subLessons.map((sub, idx) => (

              <div key={sub.id}>

                <SubLessonCard

                  subLesson={sub}

                  index={idx}

                  onChange={handleSubLessonChange}

                  onDelete={confirmDeleteSubLesson}

                  disableDelete={lesson.subLessons.length <= 1}

                  disabled={disabled}

                />

                {errors?.subLessons?.[idx]?.name && (

                  <p className="text-orange-500 text-xs mt-1 ml-10">

                    {errors.subLessons[idx].name}

                  </p>

                )}

                {errors?.subLessons?.[idx]?.video && (

                  <p className="text-orange-500 text-xs mt-1 ml-10">

                    {errors.subLessons[idx].video}

                  </p>

                )}

              </div>

            ))}

          </div>

        </SortableContext>

      </DndContext>



      {/* + Add Sub-lesson */}

      <div className="mt-4">

        <Button

          type="button"

          variant="outline"

          onClick={handleAddSubLesson}

          disabled={disabled}

          className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] rounded-full px-5 h-9 text-sm font-medium"

        >

          + Add Sub-lesson

        </Button>

      </div>



      {/* Delete Sub-Lesson Confirmation */}

      <Modal

        open={!!deleteSubTarget}

        onClose={() => setDeleteSubTarget(null)}

        title="Confirmation"

        message="Are you sure you want to delete this sub-lesson?"

        primaryLabel="Cancel"

        secondaryLabel="Delete"

        onPrimaryClick={() => setDeleteSubTarget(null)}

        onSecondaryClick={executeDeleteSubLesson}

      />



      {/* Delete Lesson Confirmation */}

      <Modal

        open={isDeleteLessonOpen}

        onClose={() => setIsDeleteLessonOpen(false)}

        title="Confirmation"

        message="Are you sure you want to delete this lesson?"

        primaryLabel="Cancel"

        secondaryLabel="Delete"

        onPrimaryClick={() => setIsDeleteLessonOpen(false)}

        onSecondaryClick={() => {

          setIsDeleteLessonOpen(false)

          onDelete(lesson.id)

        }}

      />

    </div>

  )

}

