import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Fetch courses list from /api/courses
 * @returns {{ courses: array, loading: boolean, error: Error|null }}
 */
export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get("/api/courses");
        setCourses(data.courses || []);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return { courses, loading, error };
}
