import Head from "next/head"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import AdminLayout from "@/components/layout/AdminLayout"
import Modal from "@/common/modal"
import { useRouter } from "next/router"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { X, ChevronDown } from "lucide-react"

function CourseMultiSelect({ courses, selectedIds, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const allSelected = selectedIds.length === 0
  const selectedCourses = courses.filter((c) => selectedIds.includes(c.id))

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
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full min-h-[44px] ring-1 ring-slate-300 rounded-md px-3 py-2 flex flex-wrap gap-2 items-center text-left bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
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
                aria-label={`Remove ${c.course_name ?? c.name}`}
                onClick={(e) => { e.stopPropagation(); removeCourse(c.id) }}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" aria-hidden />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
          <li>
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 accent-[#2F5FAC]"
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
                  className="w-4 h-4 rounded border-slate-300 accent-[#2F5FAC]"
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

export default function EditPromoCode() {
  const router = useRouter()
  const { id } = router.query
  const { token, logout } = useAuth()

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
  const [selectedCourseIds, setSelectedCourseIds] = useState([])
  const [courses, setCourses] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [pageError, setPageError] = useState("")

  /* Fetch courses list + promo code data */
  useEffect(() => {
    if (!token || !id) return

    const fetchAll = async () => {
      setIsLoading(true)
      setPageError("")
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [promoRes, coursesRes] = await Promise.all([
          axios.get(`/api/admin/promocodes/${id}`, { headers }),
          axios.get("/api/admin/courses", { headers, params: { limit: 999 } }),
        ])

        const p = promoRes.data.promoCode
        setFormData({
          code: p.code ?? "",
          discountType: p.discount_type === "fixed" ? "thb" : "percent",
          discountAmount: p.discount_type === "fixed" ? String(p.discount_value ?? "") : "",
          discountPercent: p.discount_type === "percent" ? String(p.discount_value ?? "") : "",
          minPurchase: p.min_price != null ? String(p.min_price) : "0",
          validFrom: p.valid_from ? p.valid_from.substring(0, 10) : "",
          validTo: p.valid_until ? p.valid_until.substring(0, 10) : "",
          usageLimit: p.max_uses != null ? String(p.max_uses) : "",
        })
        setSelectedCourseIds(p.course_ids ?? [])
        setCourses(coursesRes.data?.courses || [])
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          await logout()
          return
        }
        if (error.response?.status === 404) {
          setPageError("Promo code not found.")
        } else {
          setPageError(error.response?.data?.message || "Failed to load promo code.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [token, id, logout])

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
      else if (v < 0) newErrors.discountAmount = "Cannot be negative"
    }
    if (formData.discountType === "percent") {
      const v = Number(formData.discountPercent)
      if (!formData.discountPercent) newErrors.discountPercent = "Discount percentage is required"
      else if (!Number.isFinite(v) || v <= 0) newErrors.discountPercent = "Must be greater than 0"
      else if (v >= 100) newErrors.discountPercent = "Cannot be 100% or more"
    }
    const minPurchase = Number(formData.minPurchase)
    if (!Number.isFinite(minPurchase) || minPurchase < 0) {
      newErrors.minPurchase = "Cannot be negative"
    } else if (formData.discountType === "thb" && minPurchase - Number(formData.discountAmount || 0) < 20) {
      newErrors.minPurchase = "Min purchase minus discount must be at least 20 THB (Omise)"
    } else if (formData.discountType === "percent" && formData.discountPercent) {
      const afterDiscount = Math.round(minPurchase * (1 - Number(formData.discountPercent) / 100) * 100) / 100
      if (afterDiscount < 20) newErrors.minPurchase = "Amount after discount must be at least 20 THB (Omise)"
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

  const handleSave = async () => {
    setSubmitError("")
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await axios.put(
        `/api/admin/promocodes/${id}`,
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
          valid_from: formData.validFrom || null,
          valid_until: formData.validTo || null,
          course_ids: selectedCourseIds,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      router.push("/admin/promocodes")
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to update promo code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = () => setDeleteModalOpen(true)

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`/api/admin/promocodes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeleteModalOpen(false)
      router.push("/admin/promocodes")
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout()
        return
      }
      setSubmitError(error.response?.data?.message || "Failed to delete promo code")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-slate-500 py-12 text-center">Loading...</p>
      </AdminLayout>
    )
  }

  if (pageError) {
    return (
      <AdminLayout>
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3">
          <p className="text-orange-500 text-sm">{pageError}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Edit Promo Code - Admin Panel</title>
      </Head>

      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800 flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            className="text-slate-400 hover:text-slate-600"
            onClick={() => router.push("/admin/promocodes")}
          >
            &larr;
          </button>
          Edit Promo Code &apos;{formData.code}&apos;
        </h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 h-11 px-8 font-medium text-[15px]"
            onClick={() => router.push("/admin/promocodes")}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 font-medium shadow-sm text-[15px]"
            onClick={handleSave}
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {submitError && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{submitError}</p>
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-4xl">
        <div className="space-y-6">

          {/* Row 1: Code + Min purchase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Set promo code *</Label>
              <Input
                name="code"
                placeholder="NEWYEAR200"
                value={formData.code}
                onChange={handleChange}
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Minimum purchase amount (THB)</Label>
              <Input
                name="minPurchase"
                type="number"
                min="0"
                placeholder="0"
                value={formData.minPurchase}
                onChange={handleChange}
                className={errors.minPurchase ? "border-red-500" : ""}
              />
              {errors.minPurchase && <p className="text-red-500 text-sm mt-1">{errors.minPurchase}</p>}
            </div>
          </div>

          {/* Row 2: Discount Type */}
          <div>
            <Label className="mb-4 block">Select discount type *</Label>
            <RadioGroup
              value={formData.discountType}
              onValueChange={(v) => setFormData((p) => ({ ...p, discountType: v }))}
              className="flex gap-8"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="thb" id="edit-thb" />
                <Label htmlFor="edit-thb">Fixed amount (THB)</Label>
                <Input
                  name="discountAmount"
                  type="number"
                  className={`w-28 ml-2 ${errors.discountAmount && formData.discountType === "thb" ? "border-red-500" : ""}`}
                  placeholder="200"
                  value={formData.discountAmount}
                  onChange={handleChange}
                  disabled={formData.discountType !== "thb"}
                />
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percent" id="edit-percent" />
                <Label htmlFor="edit-percent">Percent (%)</Label>
                <Input
                  name="discountPercent"
                  type="number"
                  className={`w-28 ml-2 ${errors.discountPercent && formData.discountType === "percent" ? "border-red-500" : ""}`}
                  placeholder="30"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  disabled={formData.discountType !== "percent"}
                />
              </div>
            </RadioGroup>
          </div>

          {/* Row 3: Courses Included */}
          <div>
            <Label className="mb-2 block">Courses Included</Label>
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
              <Label className="mb-2 block">Valid From *</Label>
              <Input
                name="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={handleChange}
                className={errors.validFrom ? "border-red-500" : ""}
              />
              {errors.validFrom && <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Valid To *</Label>
              <Input
                name="validTo"
                type="date"
                value={formData.validTo}
                onChange={handleChange}
                className={errors.validTo ? "border-red-500" : ""}
              />
              {errors.validTo && <p className="text-red-500 text-sm mt-1">{errors.validTo}</p>}
            </div>
          </div>

          {/* Row 5: Usage Limit */}
          <div>
            <Label className="mb-2 block">Usage Limit (leave empty for unlimited)</Label>
            <Input
              name="usageLimit"
              type="number"
              min="1"
              placeholder="Unlimited"
              className={`max-w-xs ${errors.usageLimit ? "border-red-500" : ""}`}
              value={formData.usageLimit}
              onChange={handleChange}
            />
            {errors.usageLimit && <p className="text-red-500 text-sm mt-1">{errors.usageLimit}</p>}
          </div>

        </div>
      </section>

      <div className="flex justify-end mt-4 max-w-4xl">
        <Button
          variant="ghost"
          className="text-red-500 hover:bg-red-50 hover:text-red-600 font-medium"
          onClick={handleDeleteClick}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Promo Code"}
        </Button>
      </div>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Promo Code"
        message={`Are you sure you want to delete "${formData.code}"? This cannot be undone.`}
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimaryClick={handleDeleteConfirm}
        onSecondaryClick={() => setDeleteModalOpen(false)}
      />
    </AdminLayout>
  )
}
