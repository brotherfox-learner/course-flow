import { useState } from "react";
import Card from "../common/card";
import NavBar from "@/common/navbar/NavBar";
import SubFooter from "@/common/SubFooter";
import Footer from "@/common/Footer";

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
    <>
      <NavBar/>
      {/* <button className="bg-blue-500 text-white p-2 rounded-md mb-4" onClick={handleGetCourses}>
        Load Courses
      </button>
      <section className=" grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 lg:w-[1119px] mx-auto justify-center items-center lg:gap-[24px]">
        {courses.map((course) => (
          <Card
            key={course.id}
            courseName={course.course_name}
            description={course.course_summary}
            lessonCount={course.total_learning_time}
            durationHours={course.total_learning_time}
            imageUrl={course.cover_img_url}
          />
        ))}
      </section> */}
      <SubFooter/>
      <Footer/>
    </>
  );
}