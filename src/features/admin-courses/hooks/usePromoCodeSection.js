import { useState } from "react"
import axios from "axios"

const EMPTY_PROMO = {
  code: "",
  discountType: "percent",
  discountAmount: "",
  discountPercent: "",
  minPurchase: "0",
  validFrom: "",
  validTo: "",
  usageLimit: "",
}

/**
 * Manages promo code form state and submission.
 * Used by both add.jsx (create-on-course-save) and [id]/index.jsx (create-standalone).
 *
 * @param {string|null} token
 * @param {Function} onError - called with error message string
 */
export function usePromoCodeSection(token, onError) {
  const [hasPromoCode, setHasPromoCode] = useState(false)
  const [promoData, setPromoData] = useState(EMPTY_PROMO)
  const [isAddingPromo, setIsAddingPromo] = useState(false)

  const updatePromo = (field, value) => {
    setPromoData((prev) => ({ ...prev, [field]: value }))
  }

  const resetPromo = () => setPromoData(EMPTY_PROMO)

  /**
   * Create promo code and attach to a course. Used on the edit page.
   *
   * @param {number|string} courseId
   * @param {Function} onSuccess - called with updated promoCodes array
   */
  const handleAddPromo = async (courseId, onSuccess) => {
    if (!promoData.code.trim()) return
    if (!promoData.validFrom || !promoData.validTo) {
      onError?.("Please fill in Valid From and Valid To")
      return
    }
    setIsAddingPromo(true)
    try {
      await axios.post(
        "/api/admin/promocodes/create",
        {
          code: promoData.code,
          name: promoData.code,
          discount_type: promoData.discountType === "thb" ? "fixed" : "percent",
          discount_value:
            promoData.discountType === "thb"
              ? Number(promoData.discountAmount)
              : Number(promoData.discountPercent),
          min_price: Number(promoData.minPurchase) || 0,
          max_uses: promoData.usageLimit ? Number(promoData.usageLimit) : null,
          valid_from: promoData.validFrom,
          valid_until: promoData.validTo,
          course_ids: [Number(courseId)],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const res = await axios.get(`/api/admin/courses/${courseId}/promocodes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      onSuccess?.(res.data?.promoCodes ?? [])
      resetPromo()
    } catch (err) {
      onError?.(err.response?.data?.message || "Failed to create promo code")
    } finally {
      setIsAddingPromo(false)
    }
  }

  /**
   * Build promo payload for inline use during course creation (add.jsx).
   * Returns null if no promo should be created.
   */
  const getPromoPayload = (courseId) => {
    if (!hasPromoCode || !promoData.code) return null
    return {
      code: promoData.code,
      name: promoData.code,
      discount_type: promoData.discountType === "thb" ? "fixed" : "percent",
      discount_value:
        promoData.discountType === "thb"
          ? Number(promoData.discountAmount)
          : Number(promoData.discountPercent),
      min_price: Number(promoData.minPurchase) || 0,
      max_uses: promoData.usageLimit ? Number(promoData.usageLimit) : null,
      valid_from: promoData.validFrom || null,
      valid_until: promoData.validTo || null,
      course_ids: [courseId],
    }
  }

  return {
    hasPromoCode,
    setHasPromoCode,
    promoData,
    updatePromo,
    resetPromo,
    isAddingPromo,
    handleAddPromo,
    getPromoPayload,
  }
}
