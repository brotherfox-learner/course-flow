import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import NavBar from "@/common/navbar/NavBar";
import Footer from "@/common/Footer";
import { useAuth } from "@/context/AuthContext";
import { useCourseDetail } from "@/features/course/hooks/useCourseDetail";
import { CourseProgress, CourseContent, CourseContentFooter } from "@/features/course-learning";

/** แปลง lessons เป็นรายการ sub-lesson แบบแบน (ใช้สำหรับ Previous/Next) */
function getFlatSubLessons(lessons) {
  const flat = [];
  (lessons || []).forEach((lesson, lessonIndex) => {
    (lesson.sub_lessons || []).forEach((sub, subIndex) => {
      flat.push({ lesson, sub, lessonIndex, subIndex });
    });
  });
  return flat;
}

/** หน้ารายวิชาเรียน — เลือกหัวข้อ, บันทึกความคืบหน้า (จบแล้ว/กำลังเรียน) */
export default function CourseLearnPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isLoggedIn, loading: authLoading, token } = useAuth();
  const { course, lessons, loading: courseLoading } = useCourseDetail(id);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [selectedSubLesson, setSelectedSubLesson] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedSubLessonIds, setCompletedSubLessonIds] = useState([]);
  const [inProgressSubLessonIds, setInProgressSubLessonIds] = useState([]);
  const videoSectionRef = useRef(null);

  // ยังไม่ล็อกอินให้ redirect ไปหน้า login
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
  }, [authLoading, isLoggedIn, router]);

  // ดึงสถานะลงทะเบียนคอร์สนี้ (active/completed ถึงจะเข้าเรียนได้)
  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get("/api/my-courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || !res?.data?.courses) return;
        const enrolled = res.data.courses.find((c) => String(c.courseId) === String(id));
        setEnrollmentStatus(enrolled ? enrolled.enrollmentStatus : null);
      } catch {
        if (!cancelled) setEnrollmentStatus(null);
      }
    })();
    return () => { cancelled = true; };
  }, [token, id]);

  /** ดึงความคืบหน้าเรียน (หัวข้อจบแล้ว, กำลังเรียน, เปอร์เซ็นต์) จาก API */
  const fetchProgress = async () => {
    if (!token || !id) return;
    try {
      const res = await axios.get(`/api/courses/${id}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompletedSubLessonIds(res.data?.completedSubLessonIds ?? []);
      setInProgressSubLessonIds(res.data?.inProgressSubLessonIds ?? []);
      setProgressPercent(res.data?.progressPercent ?? 0);
    } catch {
      setCompletedSubLessonIds([]);
      setInProgressSubLessonIds([]);
      setProgressPercent(0);
    }
  };

  // โหลด progress ตอนเข้าเพจ
  useEffect(() => {
    if (!token || !id) return;
    fetchProgress();
  }, [token, id]);

  /** บันทึกว่าหัวข้อนี้เรียนจบแล้ว (วงกลมเต็ม) */
  const handleMarkComplete = async (subLessonId) => {
    if (!token || !id || !subLessonId) return;
    try {
      await axios.post(
        `/api/courses/${id}/progress`,
        { sub_lesson_id: subLessonId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProgress();
    } catch {
      // ignore
    }
  };

  /** คลิกหัวข้อใน sidebar — เลือกหัวข้อ + บันทึกสถานะกำลังเรียน (ครึ่งวงกลม) */
  const handleSubLessonClick = async (lesson, sub, lessonIndex, subIndex) => {
    setSelectedSubLesson({ lesson, sub, lessonIndex, subIndex });
    const subId = sub?.id;
    if (!token || !id || !subId) return;
    const alreadyCompleted = (completedSubLessonIds || []).some((cid) => String(cid) === String(subId));
    if (alreadyCompleted) return;
    try {
      await axios.post(
        `/api/courses/${id}/progress`,
        { sub_lesson_id: subId, status: "in_progress" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProgress();
    } catch {
      // ignore
    }
  };

  // มือถือ: เลื่อนไปที่วิดีโอเมื่อเปลี่ยนหัวข้อ
  useEffect(() => {
    if (!selectedSubLesson || !videoSectionRef.current) return;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) {
      const el = videoSectionRef.current;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const offsetFromTop = 96;
      window.scrollTo({ top: top - offsetFromTop, behavior: "smooth" });
    }
  }, [selectedSubLesson]);

  const currentSubLessonKey =
    selectedSubLesson != null
      ? `${selectedSubLesson.lessonIndex}-${selectedSubLesson.sub?.id ?? selectedSubLesson.subIndex}`
      : null;

  const flatSubLessons = getFlatSubLessons(lessons);
  const currentIndex = flatSubLessons.findIndex(
    (item) =>
      `${item.lessonIndex}-${item.sub?.id ?? item.subIndex}` === currentSubLessonKey
  );
  const hasPreviousLesson = currentIndex > 0;
  const hasNextLesson = currentIndex >= 0 && currentIndex < flatSubLessons.length - 1;
  /** กด Previous — กลับไปหัวข้อก่อนหน้า */
  const handlePreviousLesson = () => {
    if (!hasPreviousLesson) return;
    const prev = flatSubLessons[currentIndex - 1];
    setSelectedSubLesson(prev);
  };
  /** กด Next — ไปหัวข้อถัดไป + บันทึกสถานะกำลังเรียน */
  const handleNextLesson = async () => {
    if (!hasNextLesson) return;
    const next = flatSubLessons[currentIndex + 1];
    setSelectedSubLesson(next);
    const subId = next?.sub?.id;
    if (!token || !id || !subId) return;
    const alreadyCompleted = (completedSubLessonIds || []).some((cid) => String(cid) === String(subId));
    if (alreadyCompleted) return;
    try {
      await axios.post(
        `/api/courses/${id}/progress`,
        { sub_lesson_id: subId, status: "in_progress" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProgress();
    } catch {
      // ignore
    }
  };

  if (authLoading || !isLoggedIn) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="body2 text-gray-500">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!id) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="body2 text-gray-500">Invalid course.</p>
        </main>
        <Footer />
      </>
    );
  }

  if (courseLoading) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="body2 text-gray-500">Loading course...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!course) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
          <p className="body2 text-gray-500">Course not found.</p>
          <button
            type="button"
            onClick={() => router.push("/my-courses")}
            className="body2 text-blue-500 hover:underline"
          >
            Back to My Courses
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const isEnrolled = enrollmentStatus === "active" || enrollmentStatus === "completed";
  if (enrollmentStatus !== null && !isEnrolled) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
          <p className="body2 text-gray-500">You need to enroll in this course first.</p>
          <button
            type="button"
            onClick={() => router.push(`/courses/${id}`)}
            className="body2 text-blue-500 hover:underline"
          >
            View course detail
          </button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-white  ">
        <div className="w-full max-w-[375px] md:max-w-[768px] lg:max-w-[1440px] mx-auto px-4 pt-4 md:pt-6 md:px-6 lg:px-[10vw] xl:px-[160px] lg:pt-[100px]">
          <section className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-6" aria-label="Course learning">
            <CourseProgress
              courseName={course.course_name}
              courseSummary={course.course_summary}
              progressPercent={progressPercent}
              lessons={lessons}
              completedSubLessonKeys={new Set(completedSubLessonIds.map(String))}
              inProgressSubLessonKeys={new Set(inProgressSubLessonIds.map(String))}
              currentSubLessonKey={currentSubLessonKey}
              onSubLessonClick={handleSubLessonClick}
              className="lg:sticky lg:top-24 lg:shrink-0"
            />
            <div className="flex-1 min-w-0">
              <CourseContent
                subLessonName={selectedSubLesson?.sub?.name ?? null}
                courseCoverImageUrl={course.cover_img_url ?? null}
                assignmentQuestion="What are the 4 elements of service design?"
                assignmentStatus="Pending"
                videoSectionRef={videoSectionRef}
                contentType={selectedSubLesson?.sub?.content_type ?? "video"}
                content={selectedSubLesson?.sub?.content ?? null}
                subLessonId={selectedSubLesson?.sub?.id ?? null}
                onMarkComplete={handleMarkComplete}
              />
            </div>
          </section>
        </div>
        <CourseContentFooter
          onPrevious={handlePreviousLesson}
          onNext={handleNextLesson}
          hasPrevious={hasPreviousLesson}
          hasNext={hasNextLesson}
        />
      </main>
      <Footer />
    </>
  );
}
