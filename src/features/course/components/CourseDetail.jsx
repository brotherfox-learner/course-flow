"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../common/accordion";
import Card from "../../../common/card";
import Button from "../../../common/navbar/Button";
import Modal from "../../../common/modal";
import { useCourseDetail, useSubscribeModal } from "../hooks";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/features/wishlist/hooks";
import CourseDetailSkeleton from "./CourseDetailSkeleton";

export default function CourseDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [barExpanded, setBarExpanded] = useState(false);

  const { course, lessons, otherCourses, loading } = useCourseDetail(id);

  const { isLoggedIn, token, user } = useAuth();
  const isLogin = isLoggedIn;
  const { courses: wishlistCourses, addToWishlist, removeFromWishlist } = useWishlist(user?.id, token);
  const isInWishlist = course && wishlistCourses.some((c) => Number(c.courseId) === Number(course.id));
  const [wishlistAdding, setWishlistAdding] = useState(false);
  const [wishlistRemoving, setWishlistRemoving] = useState(false);
  const {
    showConfirmModal,
    handleSubscribe,
    handleConfirmSubscribe,
    handleCancelSubscribe,
  } = useSubscribeModal(course?.slug, isLoggedIn, router.push.bind(router));

  const handleWishlistClick = async () => {
    if (!isLogin) {
      router.push("/login");
      return;
    }
    if (!course?.id) return;
    if (isInWishlist) {
      setWishlistRemoving(true);
      try {
        await removeFromWishlist(course.id);
      } finally {
        setWishlistRemoving(false);
      }
    } else {
      setWishlistAdding(true);
      try {
        await addToWishlist(course.id);
      } finally {
        setWishlistAdding(false);
      }
    }
  };

  const wishlistButtonLabel = wishlistAdding
    ? "Adding..."
    : wishlistRemoving
      ? "Removing from wishlist..."
      : isInWishlist
        ? "Already added to wishlist"
        : "Add to Wishlist";
  const wishlistButtonDisabled = wishlistAdding || wishlistRemoving;

  if (loading) {
    return <CourseDetailSkeleton />;
  }
  if (!course) return <div className="p-10 text-center text-slate-500">Course not found</div>;

  const title = course.course_name || "Course Title";
  const price = course.price ? Number(course.price).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00";

  return (
    <main className="min-h-screen bg-white font-['Inter']">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-8 md:pt-6 lg:px-12 lg:pt-[53px] xl:px-[160px] 2xl:max-w-[1600px] 2xl:px-[180px]">
        <nav className="mb-4 md:mb-6 lg:mb-[23px]" aria-label="Back to courses">
          <Link href="/courses" className="text-blue-500 font-bold flex items-center gap-2 hover:opacity-70">
            <span className="text-[16px]" aria-hidden="true">←</span> Back
          </Link>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6 xl:max-w-[1120px] 2xl:max-w-[1240px]">

          <div className="flex flex-col items-start w-full gap-8 md:gap-12 lg:gap-[100px] lg:min-w-0 lg:max-w-[739px] lg:flex-1 2xl:max-w-[820px]">

            <div className="relative w-full rounded-[8px] overflow-hidden bg-slate-900 aspect-video lg:aspect-auto lg:h-[360px] xl:h-[460px] 2xl:h-[510px]">
              <img src={course.cover_img_url} className="w-full h-full object-cover opacity-90" alt={title} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 lg:w-[104px] lg:h-[104px] bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition" aria-hidden="true">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent lg:border-t-[12px] lg:border-l-[20px] lg:border-b-[12px] ml-1" />
                </div>
              </div>
            </div>


            <section className="w-full flex flex-col gap-6" aria-labelledby="course-detail-heading">
              <h2 id="course-detail-heading" className="headline3 text-[#1E293B]">Course Detail</h2>
              <div className="body3-lg-body2 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {course.course_detail || course.course_summary}
              </div>
            </section>

            {/* Module Samples  */}
            <section className="w-full flex flex-col items-start gap-6">
              <h2 className="headline3 font-bold text-[#000000]">Module Samples</h2>
              <div className="w-full max-w-[343px] md:max-w-[520px] lg:max-w-full">
                <Accordion type="single" collapsible className="w-full">
                  {lessons.map((lesson, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="w-full max-w-[343px] md:max-w-[520px] lg:max-w-full">
                      <AccordionTrigger>
                        <div className="relative flex w-full min-w-0">
                          <span className="absolute left-0 text-gray-700 body1 shrink-0 w-8">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="body1 w-[300px] md:w-[480px] lg:w-full text-[#1E293B] pl-12 text-left">
                            {(lesson.name ?? "").replace(/^\d{2}\s+/, "") || lesson.name}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="flex flex-col gap-1 mt-4 pl-13 list-none">
                          {lesson.sub_lessons?.map((sub, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2 w-[250px] md:w-[480px]">
                              <span className="mt-[10px] w-1.5 h-1.5 rounded-full bg-[#94A3B8] shrink-0" aria-hidden="true" />
                              <span className="body2 text-gray-700 leading-[1.6]">
                                {sub.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <div className="w-full max-w-[343px] md:max-w-[520px] lg:max-w-full border-b border-[#D6D9E4]" aria-hidden="true" />
              </div>
            </section>
          </div>

          <aside className="hidden lg:block lg:w-[357px] lg:shrink-0 lg:sticky lg:top-8 2xl:w-[400px]">
            <div className="bg-white rounded-[8px] py-8 px-6 flex flex-col gap-6 shadow-[4px_4px_24px_rgba(0,0,0,0.08)]">
              <span className="body3 text-[#F47E20]">Course</span>
              <div className="flex flex-col gap-2">
                <h1 className="headline3 text-[#000000]">{title}</h1>
                <p className="body2 text-[#646D89] line-clamp-2">{course.course_summary}</p>
              </div>
              <p className="headline3 text-[#646D89]">THB {price}</p>
              <div className="flex flex-col gap-4 pt-10 border-t border-[#D6D9E4]">
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  disabled={wishlistButtonDisabled}
                  className="w-full py-[18px] px-8 rounded-[12px] border border-[#F47E20] text-[#F47E20] body2 font-bold text-center hover:opacity-90 transition shadow-[4px_4px_24px_rgba(0,0,0,0.08)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {wishlistButtonLabel}
                  {isInWishlist && (
                    <img
                      src="/check.svg"
                      alt=""
                      className="w-4 h-4 shrink-0 [filter:invert(58%)_sepia(98%)_saturate(2476%)_hue-rotate(360deg)_brightness(101%)_contrast(95%)]"
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSubscribe}
                  className="w-full py-[18px] px-8 rounded-[12px] bg-[#2F5FAC] text-white body2 font-bold text-center hover:opacity-90 transition shadow-[4px_4px_24px_rgba(0,0,0,0.08)]"
                >
                  Subscribe This Course
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

    {/* Other Interesting courses */}
      <section
        className="w-full mt-10 lg:mt-[100px] bg-gray-100 min-h-[560px] lg:min-h-[680px] py-16 lg:py-24 xl:py-[100px]"
        aria-labelledby="other-courses-heading"
      >
        <div className=" mx-auto px-4 md:px-8 lg:px-12 xl:px-[160px] 2xl:px-[180px]">
          <p id="other-courses-heading" className="headline3-lg-headline2 text-center mb-6 lg:mb-8">
            Other Interesting Course
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-[1119px] mx-auto">
            {otherCourses.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`} className="flex justify-center lg:justify-start">
                <Card
                  courseName={c.course_name}
                  description={c.course_summary}
                  lessonCount={c.lesson_count}
                  durationHours={c.total_learning_time}
                  imageUrl={c.cover_img_url}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

    {/* paymentsection */}
      {/* STICKY BAR - mobile / md (ตาม spec), lg ซ่อน */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 w-full">
        <div className="w-full flex flex-col items-stretch p-4 gap-2 rounded-t-[8px] md:rounded-none bg-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col justify-center items-center gap-2">
            <header className="flex flex-row justify-end items-start gap-4 w-full min-h-[52px]">
              <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                <h3 className="body2 text-black truncate">
                  {title}
                </h3>
                {barExpanded && (
                  <p className="body4 text-[#646D89] line-clamp-2">
                    {course.course_summary}
                  </p>
                )}
                <p className="body2 text-[#646D89]">
                  THB {price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBarExpanded((prev) => !prev)}
                className="shrink-0 w-6 h-6 flex items-center justify-center text-[#646D89]"
                aria-expanded={barExpanded}
                aria-label={barExpanded ? "ย่อ" : "ขยาย"}
              >
                {barExpanded ? "▲" : "▼"}
              </button>
            </header>
            <div className="flex flex-row items-stretch gap-2 w-full h-[34px]">
              <Button
                variant="secondary"
                size="md"
                onClick={handleWishlistClick}
                disabled={wishlistButtonDisabled}
                className="flex-1 h-[34px] body4 !font-bold !leading-[150%] flex items-center justify-center gap-1"
              >
                {wishlistButtonLabel}
                {isInWishlist && (
                  <img
                    src="/check.svg"
                    alt=""
                    className="w-3 h-3 shrink-0 [filter:invert(58%)_sepia(98%)_saturate(2476%)_hue-rotate(360deg)_brightness(101%)_contrast(95%)]"
                  />
                )}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubscribe}
                className="flex-1 h-[34px] body4 !font-bold !leading-[150%]"
              >
                Subscribe This Course
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={showConfirmModal}
        onClose={handleCancelSubscribe}
        title="Confirmation"
        message={`Do you sure to subscribe ${title} Course?`}
        primaryLabel="Yes, I want to subscribe"
        secondaryLabel="No, I don't"
        onPrimaryClick={handleConfirmSubscribe}
        onSecondaryClick={handleCancelSubscribe}
      />
    </main>
  );
}
