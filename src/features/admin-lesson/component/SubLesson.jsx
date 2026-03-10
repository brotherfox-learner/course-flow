import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Button from "@/common/navbar/Button"
import { Input } from "@base-ui/react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
export default function SubLesson({ subLesson, setSubLessons }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({
        id: `sublesson-${subLesson.id}`
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    function deleteSubLesson() {
        setSubLessons(prev =>
            prev.filter(sub => sub.id !== subLesson.id)
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-full flex items-start gap-6 bg-gray-100 border border-gray-300 px-[16px] py-[24px] rounded-lg"
        >

            {/* drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="flex justify-center cursor-grab"
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
            <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-col gap-1 w-[530px]">
                    <label htmlFor="sublesson">Sub-Lesson Name *</label>
                    <Input
                        value={subLesson.name}
                        onChange={(e) => {

                            setSubLessons(prev =>
                                prev.map(sub =>
                                    sub.id === subLesson.id
                                        ? { ...sub, name: e.target.value }
                                        : sub
                                )
                            )

                        }}
                        className="p-3 bg-white border border-gray-400 rounded-lg"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label>Content Type *</label>

                    <Select
                        value={subLesson.type}
                        onValueChange={(value) => {

                            setSubLessons(prev =>
                                prev.map(sub =>
                                    sub.id === subLesson.id
                                        ? { ...sub, type: value }
                                        : sub
                                )
                            )

                        }}
                    >

                        <SelectTrigger className="w-full max-w-[180px] bg-white">
                            <SelectValue placeholder="Select Content Type" />
                        </SelectTrigger>

                        <SelectContent side="bottom" sideOffset={4} className="bg-white">
                            <SelectGroup>
                                <SelectItem value="vdo">Video</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                            </SelectGroup>
                        </SelectContent>

                    </Select>

                </div>
                {/* VDO sub-lesson */}
                {subLesson.type === "text" && (
                    <div>
                        <label>Text *</label>
                        <textarea
                            rows={3}
                            placeholder="Write lesson content..."
                            className="w-full mt-2 bg-white border border-gray-400 rounded-xl px-4 py-3 body3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-y transition-colors"
                            value={subLesson.content}
                            onChange={(e) => {
                                setSubLessons(prev =>
                                    prev.map(sub =>
                                        sub.id === subLesson.id
                                            ? { ...sub, content: e.target.value }
                                            : sub
                                    )
                                )
                            }}
                        />
                    </div>
                )}

                {/* Text sub-lesson */}
                {subLesson.type === "vdo" && (
                    <div>
                        <label>Video *</label>
                        <div className="mt-2 w-[140px] h-[140px] border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center text-[#2F5FAC] bg-[#F8FAFC] hover:bg-blue-50 hover:border-[#8BA4D4] cursor-pointer transition-colors">
                            <span className="text-3xl font-light mb-2">+</span>
                            <span className="text-[14px] font-medium">Upload Video</span>
                        </div>
                    </div>
                )}

            </div>
            <Button
                variant="ghost"
                size="ghost"
                onClick={deleteSubLesson}
            >
                Delete
            </Button>

        </div>
    )
}