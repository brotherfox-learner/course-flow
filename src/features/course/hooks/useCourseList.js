import { useState, useMemo, useCallback } from "react";
import { useCourses } from "./useCourses";

const DEFAULT_PAGE_SIZE = 12;

function filterCoursesBySearch(courses, search) {
  if (!search) return courses;
  const searchLower = search.toLowerCase();
  return courses.filter(
    (course) =>
      course.course_name?.toLowerCase().includes(searchLower) ||
      course.course_summary?.toLowerCase().includes(searchLower)
  );
}

/**
 * Course list with search and pagination (for CourseCard page)
 * @param {number} [pageSize=12]
 * @returns {{ courses, loading, error, search, page, filteredCourses, visibleCourses, handleSearchChange, handlePageChange, pageSize }}
 */
export function useCourseList(pageSize = DEFAULT_PAGE_SIZE) {
  const { courses, loading, error } = useCourses();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredCourses = useMemo(
    () => filterCoursesBySearch(courses, search),
    [courses, search]
  );

  const startIndex = (page - 1) * pageSize;
  const visibleCourses = useMemo(
    () => filteredCourses.slice(startIndex, startIndex + pageSize),
    [filteredCourses, startIndex, pageSize]
  );

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    courses,
    loading,
    error,
    search,
    page,
    filteredCourses,
    visibleCourses,
    handleSearchChange,
    handlePageChange,
    pageSize,
  };
}
