import { useState, useCallback, useEffect } from "react";
import {
  fetchWishlist as fetchWishlistApi,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from "../services/wishlist.service";

/**
 * @param {string} [userId] - Logged-in user id (from useAuth). If null/undefined, no fetch.
 * @param {string} [token] - Auth token for POST/DELETE wishlist.
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
      const data = await fetchWishlistApi(userId);
      setCourses(data);
    } catch (err) {
      console.error("useWishlist fetch:", err);
      setError(err.message || "Failed to load wishlist");
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
        await addToWishlistApi(courseId, token);
        await refetch();
        return { success: true };
      } catch (err) {
        console.error("addToWishlist:", err);
        return { success: false, error: err.message || "Failed to add to wishlist" };
      }
    },
    [token, refetch]
  );

  const removeFromWishlist = useCallback(
    async (courseId) => {
      if (!token) return { success: false, error: "Not logged in" };
      try {
        await removeFromWishlistApi(courseId, token);
        await refetch();
        return { success: true };
      } catch (err) {
        console.error("removeFromWishlist:", err);
        return { success: false, error: err.message || "Failed to remove from wishlist" };
      }
    },
    [token, refetch]
  );

  return { courses, loading, error, refetch, addToWishlist, removeFromWishlist };
}
