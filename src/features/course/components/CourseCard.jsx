import Card from "../../../common/card";
import SearchBox from "../../../common/searchbox";
import Link from "next/link";
import Pagination from "../../../common/pagination.jsx";
import CourseCardSkeleton from "./CourseCardSkeleton";
import { useCourseList } from "../hooks";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/features/wishlist/hooks";

const PAGE_SIZE = 12;

export default function CourseCard() {
  const {
    loading,
    search,
    page,
    filteredCourses,
    visibleCourses,
    handleSearchChange,
    handlePageChange,
    resetSearch,
    pageSize,
  } = useCourseList(PAGE_SIZE);
  const { user, token, isLoggedIn } = useAuth();
  const { courses: wishlistCourses, addToWishlist, removeFromWishlist } = useWishlist(
    isLoggedIn ? user?.id : null,
    token
  );

  const handleWishlistToggle = async (courseId) => {
    if (!isLoggedIn || !token) return;
    const isInWishlist = wishlistCourses.some((c) => Number(c.courseId) === Number(courseId));
    if (isInWishlist) {
      await removeFromWishlist(courseId);
    } else {
      await addToWishlist(courseId);
    }
  };

  return (
    <div className="min-h-auto mb-[30px] lg:mb-20 bg-white flex flex-col items-center justify-center mx-auto relative overflow-x-hidden">
      <div>
        <img src="/ellipse.svg" className=" absolute w-9 h-9  right-[-12px] top-[161px] lg:w-[74px] lg:h-[74px] lg:top-[205px] lg:right-[-21px]" alt="" />
        <img src="/green_cross.svg" className=" absolute w-[15.56px] h-[15.56px] left-[71px] top-[177px] lg:w-[18px] lg:h-[18px] lg:top-[205px] lg:left-[250px]" alt="" />
        <div className="absolute  w-[8.56px] h-[8.56px] left-[36px] top-[40px] rounded-full  border-[3px] lg:w-[10px] lg:h-[10px] lg:left-[75px] lg:top-[50px] border-[#2F5FAC] box-sizing-border" aria-hidden="true" />
        <img src="/orange_polygon.svg" className=" absolute w-[27.75px]  h-[27.75px] right-[45px] top-[60px] lg:w-[35px] lg:h-[35px] lg:right-[106px] lg:top-[125px]" alt="" />
        <img src="/ellipse.svg" className=" absolute w-[20.25px]  h-[20.25px] left-[-10px] top-[85.92px] lg:w-[25px] lg:h-[25px] lg:left-[32px] lg:top-[107px]" alt="" />
      </div>
      <div className="relative w-full max-w-[375px] h-[198px] flex flex-col items-center justify-center gap-[32px] overflow-hidden lg:gap-[40px] lg:mt-[30px] lg:mb-[50px] xl:gap-[60px] xl:mt-[50px] xl:mb-[70px] md:max-w-full md:h-auto md:min-h-[198px] ">
        <p className="headline3-lg-headline2 text-gray-900 text-center">
          Our Courses
        </p>
        <SearchBox
          value={search}
          onChange={handleSearchChange}
          onClear={resetSearch}
          placeholder="Search..."
        />
      </div>

      {loading ? (
        <section
          className="grid gap-[32px] grid-cols-1 md:grid-cols-2 md:gap-y-[32px] md:gap-x-[15px] lg:grid-cols-2 lg:gap-x-[25px] xl:grid-cols-3 xl:gap-y-[60px] xl:gap-x-[24px] xl:w-[1119px] 2xl:grid-cols-4 2xl:w-[1500px] 2xl:gap-y-[50px] 2xl:gap-x-[24px]"
          aria-label="Loading courses"
        >
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </section>
      ) : (
        <>
          <section className="grid  gap-[32px] grid-cols-1 md:grid-cols-2 md:gap-y-[32px] md:gap-x-[15px]  lg:grid-cols-2  lg:gap-x-[25px]  xl:grid-cols-3 xl:gap-y-[60px] xl:gap-x-[24px]  xl:w-[1119px] 2xl:grid-cols-4 2xl:w-[1500px] 2xl:gap-y-[50px] 2xl:gap-x-[24px]">
            {visibleCourses.length > 0 ? (
              visibleCourses.map((course) => {
                const isInWishlist = wishlistCourses.some(
                  (c) => Number(c.courseId) === Number(course.id)
                );
                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card
                      courseName={course.course_name}
                      description={course.course_summary}
                      lessonCount={course.lesson_count}
                      durationHours={course.total_learning_time}
                      imageUrl={course.cover_img_url}
                      wishlistHeart={isLoggedIn}
                      isInWishlist={isInWishlist}
                      onWishlistClick={() => handleWishlistToggle(course.id)}
                    />
                  </Link>
                );
              })
            ) : search ? (
              <div className="col-span-full max-w-[600px] mx-auto py-12 pb-24 lg:pb-32 min-h-[55vh] text-left">
                <h2 className="headline3 text-gray-900 font-bold mb-3">
                  Sorry, we couldn&apos;t find any results for &quot;{search}&quot;
                </h2>
                <p className="body2 text-gray-700 mb-4">
                  Try adjusting your search. Here are some ideas:
                </p>
                <ul className="list-disc list-inside body2 text-gray-700 space-y-2">
                  <li>Make sure all words are spelled correctly</li>
                  <li>Try different search terms</li>
                  <li>Try more general search terms</li>
                </ul>
              </div>
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No courses available.</p>
              </div>
            )}
          </section>

          {filteredCourses.length > pageSize && (
            <div className="flex justify-center mt-8 mb-15">
              <Pagination
                currentPage={page}
                totalItems={filteredCourses.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
