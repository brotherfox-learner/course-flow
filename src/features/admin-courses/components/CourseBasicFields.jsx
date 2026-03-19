import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Label } from "@/shared/ui/label"

/**
 * Reusable form section for basic course info fields.
 * Used by both AddCourse (add.jsx) and EditCourse ([id]/index.jsx).
 *
 * @param {object} formData - { courseName, price, totalLearningTime, courseSummary, courseDetail }
 * @param {object} errors
 * @param {Function} onChange - (e) => void, updates formData by name
 * @param {boolean} isAdd - true for add form (uses courseName/price/etc keys), false for edit (name/price/learningTime/etc keys)
 */
export default function CourseBasicFields({ formData, errors = {}, onChange, isAdd = true }) {
  const nameKey = isAdd ? "courseName" : "name"
  const learningTimeKey = isAdd ? "totalLearningTime" : "learningTime"
  const summaryKey = isAdd ? "courseSummary" : "summary"
  const detailKey = isAdd ? "courseDetail" : "detail"
  const requiredColor = "text-[#C82A2A]"

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-8">
        <div className="col-span-2">
          <Label className="mb-1 block body2 text-black font-normal">
            Course name <span className={requiredColor}>*</span>
          </Label>
          <Input
            name={nameKey}
            placeholder="Place Holder"
            value={formData[nameKey] ?? ""}
            onChange={onChange}
            className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
          />
          {errors[nameKey] && (
            <p className="text-orange-500 text-sm mt-1">{errors[nameKey]}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block body2 text-black font-normal">
            Price <span className={requiredColor}>*</span>
          </Label>
          <Input
            name="price"
            placeholder="Place Holder"
            type="number"
            value={formData.price ?? ""}
            onChange={onChange}
            className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
          />
          {errors.price && (
            <p className="text-orange-500 text-sm mt-1">{errors.price}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block body2 text-black font-normal">
            Total learning time <span className={requiredColor}>*</span>
          </Label>
          <Input
            name={learningTimeKey}
            placeholder="Place Holder"
            type="number"
            value={formData[learningTimeKey] ?? ""}
            onChange={onChange}
            className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
          />
          {errors[learningTimeKey] && (
            <p className="text-orange-500 text-sm mt-1">{errors[learningTimeKey]}</p>
          )}
        </div>
      </div>

      <div className="space-y-8 mb-8">
        <div>
          <Label className="mb-1 block body2 text-black font-normal">
            Course summary <span className={requiredColor}>*</span>
          </Label>
          <Input
            name={summaryKey}
            placeholder="Place Holder"
            value={formData[summaryKey] ?? ""}
            onChange={onChange}
            className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
          />
          {errors[summaryKey] && (
            <p className="text-orange-500 text-sm mt-1">{errors[summaryKey]}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block body2 text-black font-normal">
            Course detail <span className={requiredColor}>*</span>
          </Label>
          <Textarea
            name={detailKey}
            placeholder="Place Holder"
            value={formData[detailKey] ?? ""}
            onChange={onChange}
            className="min-h-[200px] border-gray-400 rounded-lg resize-none body2 p-4 placeholder:text-gray-600"
          />
          {errors[detailKey] && (
            <p className="text-orange-500 text-sm mt-1">{errors[detailKey]}</p>
          )}
        </div>
      </div>
    </>
  )
}
