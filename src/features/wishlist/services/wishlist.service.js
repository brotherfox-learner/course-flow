/**
 * Wishlist Service – data-access layer for wishlist API calls.
 */

export async function fetchWishlist(userId) {
  const res = await fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Failed to load wishlist")
  return data.courses ?? []
}

export async function addToWishlist(courseId, token) {
  const res = await fetch("/api/wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId: Number(courseId) }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to add to wishlist")
  return data
}

export async function removeFromWishlist(courseId, token) {
  const res = await fetch("/api/wishlist", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId: Number(courseId) }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) throw new Error(data.error || "Failed to remove from wishlist")
  return data
}
