import { useEffect, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Label } from "@/shared/ui/label"
import AdminLayout from "@/shared/layouts/AdminLayout"
import { useRouter } from "next/router"
import axios from "axios"
import { useAuth } from "@/features/auth/context/AuthContext"
import { X, ChevronDown } from "lucide-react"

function CourseMultiSelect({ courses, selectedIds, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const allSelected = selectedIds.length === 0
  const selectedCourses = courses.filter((c) => selectedIds.includes(c.id))

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggleAll = () => onChange([])

  const toggleCourse = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const removeCourse = (id) => onChange(selectedIds.filter((x) => x !== id))

  return (
    <div ref={ref} className="relative w-full">
      {/* Tag area / trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full h-12 min-h-[44px] ring-1 ring-slate-300 rounded-md px-3 py-2 flex flex-wrap gap-2 items-center text-left bg-white hover:ring-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
      >
        {allSelected ? (
          <span className="text-[15px] text-slate-700">All courses</span>
        ) : (
          selectedCourses.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 bg-blue-100 border border-blue-300 rounded px-2 py-0.5 text-[13px] text-slate-700"
            >
              {c.course_name ?? c.name}
              <button
                type="button"
                aria-label={`Remove ${c.course_name}`}
                onClick={(e) => { e.stopPropagation(); removeCourse(c.id) }}
                className="text-blue-500 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" aria-hidden />
      </button>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
          {/* All courses option */}
          <li>
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 text-[#2F5FAC] accent-[#2F5FAC]"
              />
              <span className="text-[15px] text-slate-700">All courses</span>
            </label>
          </li>
          {courses.map((c) => (
            <li key={c.id}>
              <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                  className="w-4 h-4 rounded border-slate-300 text-[#2F5FAC] accent-[#2F5FAC]"
                />
                <span className="text-[15px] text-slate-700">{c.course_name ?? c.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AddPromoCode() {
  const router = useRouter()
  const { token, logout, loading, profile, isLoggedIn } = useAuth()

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percent",
    discountAmount: "",
    discountPercent: "",
    minPurchase: "0",
    validFrom: "",
    validTo: "",
    usageLimit: "",
  })
  /* [] = all courses; [id, id, ...] = specific courses */
  const [selectedCourseIds, setSelectedCourseIds] = useState([])
  const [courses, setCourses] = useState([])

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* Fetch courses list for multi-select */
  useEffect(() => {
    if (!token || loading || !isLoggedIn || profile?.role !== "admin") return
    axios
      .get("/api/admin/courses", { headers: { Authorization: `Bearer ${token}` }, params: { limit: 999 } })
      .then((r) => setCourses(r.data?.courses || []))
      .catch(() => setCourses([]))
  }, [token, loading, isLoggedIn, profile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.code?.trim()) newErrors.code = "Promo code is required"
    if (formData.discountType === "thb") {
      const v = Number(formData.discountAmount)
      if (!formData.discountAmount) newErrors.discountAmount = "Discount amount is required"
      else if (!Number.isFinite(v) || v <= 0) newErrors.discountAmount = "Must be greater than 0"
      else if (v < 0) newErrors.discountAmount = "Must be greater than 0"
    }
    if (formData.discountType === "percent") {
      const v = Number(formData.discountPercent)
      if (!formData.discountPercent) newErrors.discountPercent = "Discount percentage is required"
      else if (!Number.isFinite(v) || v <= 0) newErrors.discountPercent = "Must be greater than 0"
      else if (v >= 100) newErrors.discountPercent = "Cannot be 100% or more"
    }
    const minPurchase = Number(formData.minPurchase)
    if (!Number.isFinite(minPurchase) || minPurchase < 0) {
      newErrors.minPurchase = "Must be greater than 0"
    } else if (formData.discountType === "thb" && minPurchase - Number(formData.discountAmount || 0) < 20) {
      newErrors.minPurchase = "Min purchase minus discount must be at least 20 THB"
    } else if (formData.discountType === "percent" && formData.discountPercent) {
      const afterDiscount = Math.round(minPurchase * (1 - Number(formData.discountPercent) / 100) * 100) / 100
      if (afterDiscount < 20) newErrors.minPurchase = "Amount after discount must be at least 20 THB"
    }
    if (!formData.validFrom) newErrors.validFrom = "Start date is required"
    if (!formData.validTo) newErrors.validTo = "End date is required"
    if (formData.validFrom && formData.validTo && formData.validTo < formData.validFrom) {
      newErrors.validTo = "End date must be after start date"
    }
    if (formData.usageLimit) {
      const v = Number(formData.usageLimit)
      if (!Number.isInteger(v) || v < 1) newErrors.usageLimit = "Must be a positive integer"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await axios.post(
        "/api/admin/promocodes/create",
        {
          code: formData.code,
          name: formData.code,
          discount_type: formData.discountType === "thb" ? "fixed" : "percent",
          discount_value:
            formData.discountType === "thb"
              ? Number(formData.discountAmount)
              : Number(formData.discountPercent),
          min_price: Number(formData.minPurchase) || 0,
          max_uses: formData.usageLimit ? Number(formData.usageLimit) : null,
          valid_from: formData.validFrom,
          valid_until: formData.validTo,
          course_ids: selectedCourseIds,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      router.push("/admin/promocodes")
    } catch (error) {
      console.error("Create promo code failed:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to create promo code")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8 p-8 bg-white h-[92px] border-b border-gray-400 shrink-0">
        <h1 className="text-2xl font-medium text-slate-800">Add Promo code</h1>
        <div className="flex gap-4">
          <Button
            variant="cancel"
            size="admin"
            onClick={() => router.push("/admin/promocodes")}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="admin"
            onClick={handleSubmit}
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <div className="m-[40px] mb-16">
      {submitError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{submitError}</p>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-gray-300 shadow-sm px-[100px] pt-10 pb-[60px] mb-8">
        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* Row 1: Code + Min purchase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Set promo code <span className="text-[#C82A2A]">*</span></Label>
              <Input
                name="code"
                placeholder="Enter promo code "
                value={formData.code}
                onChange={handleChange}
                className={`h-12 text-[15px] bg-white ${errors.code ? "ring-orange-500" : ""}`}
              />
              {errors.code && <p className="text-orange-500 text-sm mt-1">{errors.code}</p>}
            </div>
            <div>
              <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Minimum purchase amount (THB)</Label>
              <Input
                name="minPurchase"
                type="number"
                min="0"
                placeholder="0"
                value={formData.minPurchase}
                onChange={handleChange}
                className={`h-12 text-[15px] bg-white ${errors.minPurchase ? "ring-orange-500" : ""}`}
              />
              {errors.minPurchase && <p className="text-orange-500 text-sm mt-1">{errors.minPurchase}</p>}
            </div>
          </div>

          {/* Row 2: Discount Type */}
          <div>
            <Label className="mb-4 block text-slate-700 font-medium text-[15px]">Select discount type <span className="text-[#C82A2A]">*</span></Label>
            <RadioGroup
              value={formData.discountType}
              onValueChange={(v) => setFormData((p) => ({ ...p, discountType: v }))}
              className="flex gap-8"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="thb" id="thb" />
                <Label htmlFor="thb" className="text-slate-700 font-medium text-[15px]">Fixed amount (THB)</Label>
                <Input
                  name="discountAmount"
                  type="number"
                  className={`w-28 ml-2 h-12 text-[15px] bg-white ${errors.discountAmount && formData.discountType === "thb" ? "ring-orange-500" : ""}`}
                  placeholder="THB"
                  value={formData.discountAmount}
                  onChange={handleChange}
                  disabled={formData.discountType !== "thb"}
                />
                {errors.discountAmount && formData.discountType === "thb" && (
                  <p className="text-orange-500 text-sm mt-1">{errors.discountAmount}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percent" id="percent" />
                <Label htmlFor="percent" className="text-slate-700 font-medium text-[15px]">Percent (%)</Label>
                <Input
                  name="discountPercent"
                  type="number"
                  className={`w-28 ml-2 h-12 text-[15px] bg-white ${errors.discountPercent && formData.discountType === "percent" ? "ring-orange-500" : ""}`}
                  placeholder="30"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  disabled={formData.discountType !== "percent"}
                />
                {errors.discountPercent && formData.discountType === "percent" && (
                  <p className="text-orange-500 text-sm mt-1">{errors.discountPercent}</p>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Row 3: Courses Included */}
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Courses Included</Label>
            <CourseMultiSelect
              courses={courses}
              selectedIds={selectedCourseIds}
              onChange={setSelectedCourseIds}
            />
            <p className="text-[12px] text-slate-400 mt-1">
              Leave as "All courses" to allow this code on every course.
            </p>
          </div>

          {/* Row 4: Validity Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Valid From <span className="text-[#C82A2A]">*</span></Label>
              <Input
                name="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={handleChange}
                className={`h-12 text-[15px] bg-white ${errors.validFrom ? "ring-orange-500" : ""}`}
              />
              {errors.validFrom && <p className="text-orange-500 text-sm mt-1">{errors.validFrom}</p>}
            </div>
            <div>
              <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Valid To <span className="text-[#C82A2A]">*</span></Label>
              <Input
                name="validTo"
                type="date"
                value={formData.validTo}
                onChange={handleChange}
                className={`h-12 text-[15px] bg-white ${errors.validTo ? "ring-orange-500" : ""}`}
              />
              {errors.validTo && <p className="text-orange-500 text-sm mt-1">{errors.validTo}</p>}
            </div>
          </div>

          {/* Row 5: Usage Limit */}
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Usage Limit (leave empty for unlimited)</Label>
            <Input
              name="usageLimit"
              type="number"
              min="1"
              placeholder="Unlimited"
              className={`max-w-xs h-12 text-[15px] bg-white ${errors.usageLimit ? "ring-orange-500" : ""}`}
              value={formData.usageLimit}
              onChange={handleChange}
            />
            {errors.usageLimit && <p className="text-orange-500 text-sm mt-1">{errors.usageLimit}</p>}
          </div>
        </form>
      </section>
      </div>
    </AdminLayout>
  )
}
