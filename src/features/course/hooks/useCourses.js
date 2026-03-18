import { useState, useEffect } from "react";
import { fetchCourses as fetchCoursesApi } from "../services/course.service";

/**
 * Fetch courses list from /api/courses
 * @returns {{ courses: array, loading: boolean, error: Error|null }}
 */
export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCoursesApi();
        setCourses(data);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { courses, loading, error };
}
