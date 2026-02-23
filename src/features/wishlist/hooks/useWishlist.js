import { useState, useCallback, useEffect } from "react";

/**
 * @param {string} [userId] - Logged-in user id (from useAuth). If null/undefined, no fetch.
 * @param {string} [token] - Auth token for POST add to wishlist.
 * @returns {{ courses: array, loading: boolean, error: string | null, refetch: () => Promise<void>, addToWishlist: (courseId: number) => Promise<{ success: boolean; error?: string }> }}
 */
export function useWishlist(userId, token) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setCourses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCourses(data.courses ?? []);
      } else {
        setError(data.error || "Failed to load wishlist");
        setCourses([]);
      }
    } catch (err) {
      console.error("useWishlist fetch:", err);
      setError("Failed to load wishlist");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addToWishlist = useCallback(
    async (courseId) => {
      if (!token) return { success: false, error: "Not logged in" };
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ courseId: Number(courseId) }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          await refetch();
          return { success: true };
        }
        return { success: false, error: data.error || "Failed to add to wishlist" };
      } catch (err) {
        console.error("addToWishlist:", err);
        return { success: false, error: "Failed to add to wishlist" };
      }
    },
    [token, refetch]
  );

  return { courses, loading, error, refetch, addToWishlist };
}
