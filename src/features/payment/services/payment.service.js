import axios from "axios"

/**
 * Payment Service – data-access layer for payment and promo-code API calls.
 */

export async function checkout(payload, token) {
  const { data } = await axios.post("/api/checkout", payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function fetchCheckoutStatus(sessionId, token) {
  const res = await fetch(`/api/checkout/status?session_id=${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch checkout status: ${res.status}`)
  return res.json()
}

export async function validatePromoCode(courseId, promoCode) {
  const { data } = await axios.post("/api/promo-codes/validate", {
    courseId,
    promoCode,
  })
  return data
}

export async function fetchCourseForPayment(courseSlug) {
  const { data } = await axios.get(`/api/courses/${courseSlug}`)
  return data
}
