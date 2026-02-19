import { useState } from "react"
import Card from "../../common/card"
//pagination
import Pagination from "../../common/pagination.jsx"

// pagination ระบุหน้าที่ต้องการแสดงผลบนหน้า Home
const PAGE_SIZE = 2

export default function CommonTest() {
  const [courses, setCourses] = useState([])
  //pagination
  const [page, setPage] = useState(1)

  const handleGetCourses = async () => {
    try {
      const response = await fetch("/api/courses")
      const data = await response.json()
      setCourses(data.courses)
      //pagination reset page เมื่อโหลดใหม่ 
      setPage(1) // 
    } catch (err) {
      console.error("Fetch error:", err)
    }
  }

  // pagination
  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const visibleCourses = courses.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <button
        className="bg-blue-500 text-white p-2 rounded-md mb-4"
        onClick={handleGetCourses}
      >
        test common
      </button>

      {/* grid 3 card ต่อแถว */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 lg:w-[1119px] mx-auto gap-[24px]">
        {visibleCourses.map((course) => (
          <Card
            key={course.id}
            courseName={course.course_name}
            description={course.course_summary}
            lessonCount={course.total_learning_time}
            durationHours={course.total_learning_time}
            imageUrl={course.cover_img_url}
          />
        ))}
      </section>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <Pagination
          currentPage={page}
          totalItems={courses.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
