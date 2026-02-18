import { useState } from "react";

export default function Home() {
  const [courses, setCourses] = useState([]);

  const handleGetCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      const data = await response.json();
      console.log(data);
      setCourses(data.courses);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      Test
      <button className="bg-blue-500 text-white p-2 rounded-md" onClick={handleGetCourses}>
        Test
      </button>
      {courses.map((course) => (
        <div key={course.id}>
          <h2>{course.course_name}</h2>
          <p>{course.course_summary}</p>
        </div>
      ))}
    </div>
  );
}
