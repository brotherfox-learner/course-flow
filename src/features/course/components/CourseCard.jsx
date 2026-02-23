import { useState, useEffect } from "react";
import axios from "axios";
import Card from "../../../common/card";
import SearchBox from "../../../common/searchbox";
import Link from "next/link";
import Pagination from "../../../common/pagination.jsx";

export default function CourseCard() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12; // ปรับขนาดตามต้องการ

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get("/api/courses");
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // 1. กรองข้อมูลจาก "ทั้งหมด" ก่อน
  const filteredCourses = courses.filter((course) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      course.course_name?.toLowerCase().includes(searchLower) ||
      course.course_summary?.toLowerCase().includes(searchLower)
    );
  });

  // 2. นำข้อมูลที่กรองแล้วมาทำ Pagination
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleCourses = filteredCourses.slice(startIndex, startIndex + PAGE_SIZE);

  // 3. ฟังก์ชันจัดการการค้นหา (พิมพ์แล้วให้กลับไปหน้า 1)
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset ไปหน้าแรกเมื่อมีการค้นหาใหม่
  };

  //ฟังก์ชันจัดการการค้นหา (พิมพ์แล้วให้กลับไปหน้า 1)
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-auto mb-[30px] lg:mb-20 bg-white flex flex-col items-center justify-center mx-auto relative overflow-x-hidden">
      <div>
        <img src="/ellipse.svg" className=" absolute w-9 h-9  right-[-12px] top-[161px] lg:w-[74px] lg:h-[74px] lg:top-[205px] lg:right-[-21px]" />
        <img src="/green_cross.svg" className=" absolute w-[15.56px] h-[15.56px] left-[71px] top-[177px] lg:w-[18px] lg:h-[18px] lg:top-[205px] lg:left-[250px]" />
        <div className="absolute  w-[8.56px] h-[8.56px] left-[36px] top-[40px] rounded-full  border-[3px] lg:w-[10px] lg:h-[10px] lg:left-[75px] lg:top-[50px] border-[#2F5FAC] box-sizing-border"></div>
        <img src="/orange_polygon.svg" className=" absolute w-[27.75px]  h-[27.75px] right-[45px] top-[60px] lg:w-[35px] lg:h-[35px] lg:right-[106px] lg:top-[125px]" />
        <img src="/ellipse.svg" className=" absolute w-[20.25px]  h-[20.25px] left-[-10px] top-[85.92px] lg:w-[25px] lg:h-[25px] lg:left-[32px] lg:top-[107px]" />
      </div>
      <div className="relative w-full max-w-[375px] h-[198px] flex flex-col items-center justify-center gap-[32px] overflow-hidden lg:gap-[40px] lg:mt-[30px] lg:mb-[50px] xl:gap-[60px] xl:mt-[50px] xl:mb-[70px] md:max-w-full md:h-auto md:min-h-[198px] ">
        <p className="headline3-lg-headline2 text-gray-900 text-center">
          Our Courses
        </p>
        <SearchBox
          value={search}
          onChange={handleSearchChange}
          placeholder="Search..."
        />
        {/* md: circle 36x36, ทางขวาของ searchbar ห่าง 11px, ใต้ searchbar 11px */}
      </div>


      {loading ? (
        <div className="max-w-[1119px] mx-auto text-center py-12">
          <p className="text-gray-500">Loading courses...</p>
        </div>
      ) : (
        <>
          <section className="grid  gap-[32px] grid-cols-1 md:grid-cols-2 md:gap-y-[32px] md:gap-x-[15px]  lg:grid-cols-2  lg:gap-x-[25px]  xl:grid-cols-3 xl:gap-y-[60px] xl:gap-x-[24px]  xl:w-[1119px] 2xl:grid-cols-4 2xl:w-[1500px] 2xl:gap-y-[50px] 2xl:gap-x-[24px]">
            {visibleCourses.length > 0 ? (
              visibleCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card
                    courseName={course.course_name}
                    description={course.course_summary}
                    lessonCount={course.lesson_count}
                    durationHours={course.total_learning_time}
                    imageUrl={course.cover_img_url}
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  {search ? "No courses found matching your search." : "No courses available."}
                </p>
              </div>
            )}
          </section>

          {/* Pagination: ส่ง totalItems เป็นจำนวนที่ Filter แล้ว */}
          {filteredCourses.length > PAGE_SIZE && (
            <div className="flex justify-center mt-8 mb-15">
              <Pagination
                currentPage={page}
                totalItems={filteredCourses.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}