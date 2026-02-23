import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Fetch course, lessons, and other courses by course id
 * @param {string|undefined} courseId - from router.query.id
 * @returns {{ course: object|null, lessons: array, otherCourses: array, loading: boolean, error: Error|null }}
 */
export function useCourseDetail(courseId) {
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [otherCourses, setOtherCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, lessonsRes, coursesRes] = await Promise.all([
          axios.get(`/api/courses/${courseId}`),
          axios.get(`/api/lessons/${courseId}`),
          axios.get("/api/courses").catch(() => ({ data: { courses: [] } })),
        ]);
        setCourse(courseRes.data);
        setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
        const all = coursesRes.data?.courses ?? [];
        const others = all
          .filter((c) => String(c.id) !== String(courseId))
          .slice(0, 3);
        setOtherCourses(others);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err);
        setCourse(null);
        setLessons([]);
        setOtherCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  return { course, lessons, otherCourses, loading, error };
}
