import { useState } from "react"
import Card from "../../common/card"
//pagination
import Pagination from "../../common/pagination.jsx"
//searchbox
import SearchBox from '../../common/searchbox.jsx';
import Modal from "../../common/modal.jsx"
// pagination ระบุหน้าที่ต้องการแสดงผลบนหน้า Home
const PAGE_SIZE = 2

export default function CommonTest() {
  const [courses, setCourses] = useState([])
  //pagination
  const [page, setPage] = useState(1)
  //modol
  const [showSubscribe, setShowSubscribe] = useState(false)   
  const [showAdmin, setShowAdmin] = useState(false)
  //search
  const [search, setSearch] = useState("")
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
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          className="bg-blue-500 text-white p-2 rounded-md"
          onClick={handleGetCourses}
        >
          test common
        </button>
        <button
          className="rounded-md border border-orange-500 bg-white px-4 py-2 text-orange-500 hover:bg-orange-50"
          onClick={() => setShowSubscribe(true)}
        >
          เปิด Modal subscribe 
        </button>
        <button
          className="rounded-md border border-orange-500 bg-white px-4 py-2 text-orange-500 hover:bg-orange-50"
          onClick={() => setShowAdmin(true)}
        >
          เปิด Modal admin
        </button>
      </div>
      {/* searchbox */}
      <div className="p-4 flex justify-center">
      <SearchBox 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
    </div>

      {/* grid 3 card ต่อแถว */}
      {/* //card */}
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

 {/* //modal      */}
      <Modal
      open={showAdmin}
      onClose={() => setShowAdmin(false)}
      title="Confirmation"
      message="Are you sure you want to delete this course?"
      primaryLabel="No, keep it"
      secondaryLabel="Yes, I want to delete this course"
      onPrimaryClick={() => {}}
    />
      <Modal
      open={showSubscribe}
    onClose={() => setShowSubscribe(false)}
    title="Confirmation"
    message="Do you sure to subscribe Service Design Essentials Course?"
    primaryLabel="Yes, I want to subscribe"
    secondaryLabel="No, I don't"
  
    onPrimaryClick={() => {}}
/>
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
