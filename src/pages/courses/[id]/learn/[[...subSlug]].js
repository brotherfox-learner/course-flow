import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import NavBar from "@/shared/components/navbar/NavBar";
import Footer from "@/shared/components/Footer";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useCourseDetail } from "@/features/course/hooks/useCourseDetail";
import { CourseProgress, CourseContent, CourseContentFooter } from "@/features/course-learning";

/** แปลง lessons เป็นรายการ sub-lesson แบบแบน (ใช้สำหรับ Previous/Next และค้นหาตาม slug/id) */
function getFlatSubLessons(lessons) {
  const flat = [];
  (lessons || []).forEach((lesson, lessonIndex) => {
    (lesson.sub_lessons || []).forEach((sub, subIndex) => {
      flat.push({ lesson, sub, lessonIndex, subIndex });
    });
  });
  return flat;
}

/** สร้าง slug สำหรับ sub-lesson โดยอิงจาก id + name เพื่อให้ unique และอ่านง่าย */
function slugifySubLesson(sub) {
  if (!sub) return null;
  const idPart = sub.id != null ? String(sub.id) : null;
  const namePart = typeof sub.name === "string" ? sub.name : "";
  const base = `${namePart}`.trim();
  const nameSlug = base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!idPart) {
    return nameSlug || null;
  }
  return nameSlug ? `${idPart}-${nameSlug}` : idPart;
}

/** หน้ารายวิชาเรียน — เลือกหัวข้อ, บันทึกความคืบหน้า (จบแล้ว/กำลังเรียน) + sync URL slug ตาม sub-lesson */
export default function CourseLearnPage() {
  const router = useRouter();
  const { id, subSlug: subSlugParam } = router.query;
  const subSlug = Array.isArray(subSlugParam) ? subSlugParam[0] : subSlugParam || null;

  const { isLoggedIn, loading: authLoading, token } = useAuth();
  const { course, lessons, loading: courseLoading } = useCourseDetail(id);

  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selectedSubLesson, setSelectedSubLesson] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedSubLessonIds, setCompletedSubLessonIds] = useState([]);
  const [inProgressSubLessonIds, setInProgressSubLessonIds] = useState([]);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  const videoSectionRef = useRef(null);

  const flatSubLessons = useMemo(() => getFlatSubLessons(lessons), [lessons]);

  // ยังไม่ล็อกอินให้ redirect ไปหน้า login
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
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
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  // ดึง course materials เมื่อ enrolled แล้ว
  useEffect(() => {
    if (!token || !id) return;
    const status = enrollmentStatus;
    if (status !== "active" && status !== "completed") return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/courses/materials?courseId=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (!cancelled) setMaterials(data.materials || []);
      } catch {
        if (!cancelled) setMaterials([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, id, enrollmentStatus]);

  /** ดึงความคืบหน้าเรียน (หัวข้อจบแล้ว, กำลังเรียน, เปอร์เซ็นต์) จาก API */
  const fetchProgress = useCallback(async () => {
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
    } finally {
      // keep silent on errors; progress UI will just show 0%
    }
  }, [token, id]);

  // โหลด progress ตอนเข้าเพจ
  useEffect(() => {
    if (!token || !id) return;
    fetchProgress();
  }, [token, id, fetchProgress]);

  /** ฟังก์ชันช่วยเลือก sub-lesson + sync URL slug ให้ตรงกับ sub-lesson ที่เลือก */
  const goToSubLesson = useCallback(
    (target) => {
      if (!target || !target.sub) {
        setSelectedSubLesson(target || null);
        return;
      }
      setSelectedSubLesson(target);

      const slug = slugifySubLesson(target.sub);
      if (!slug || !id) return;

      // บันทึก sub-lesson ล่าสุดของคอร์สนี้ไว้ใน localStorage
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(`course:lastSubLesson:${id}`, slug);
        } catch {
          // ignore storage errors
        }
      }

      const currentSlug = subSlug;
      if (currentSlug === slug) return;

      router.replace(`/courses/${id}/learn/${slug}`, undefined, { shallow: true });
    },
    [id, router, subSlug]
  );

  /** บันทึกว่าหัวข้อนี้เรียนจบแล้ว (วงกลมเต็ม) */
  const handleMarkComplete = useCallback(
    async (subLessonId) => {
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
    },
    [token, id, fetchProgress]
  );

  /** คลิกหัวข้อใน sidebar — เลือกหัวข้อ + บันทึกสถานะกำลังเรียน (ครึ่งวงกลม) */
  const handleSubLessonClick = useCallback(
    async (lesson, sub, lessonIndex, subIndex) => {
      const next = { lesson, sub, lessonIndex, subIndex };
      goToSubLesson(next);

      const subId = sub?.id;
      if (!token || !id || !subId) return;
      const alreadyCompleted = (completedSubLessonIds || []).some(
        (cid) => String(cid) === String(subId)
      );
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
    },
    [goToSubLesson, token, id, completedSubLessonIds, fetchProgress]
  );

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

  /** คำนวณ key สำหรับระบุตำแหน่ง sub-lesson ปัจจุบัน (ใช้กับ CourseProgress + previous/next) */
  const currentSubLessonKey =
    selectedSubLesson != null
      ? `${selectedSubLesson.lessonIndex}-${selectedSubLesson.sub?.id ?? selectedSubLesson.subIndex}`
      : null;

  const currentIndex = flatSubLessons.findIndex(
    (item) => `${item.lessonIndex}-${item.sub?.id ?? item.subIndex}` === currentSubLessonKey
  );
  const hasPreviousLesson = currentIndex > 0;
  const hasNextLesson = currentIndex >= 0 && currentIndex < flatSubLessons.length - 1;

  /** กด Previous — กลับไปหัวข้อก่อนหน้า */
  const handlePreviousLesson = useCallback(() => {
    if (!hasPreviousLesson) return;
    const prev = flatSubLessons[currentIndex - 1];
    goToSubLesson(prev);
  }, [hasPreviousLesson, flatSubLessons, currentIndex, goToSubLesson]);

  /** กด Next — ไปหัวข้อถัดไป + บันทึกสถานะกำลังเรียน */
  const handleNextLesson = useCallback(async () => {
    if (!hasNextLesson) return;
    const next = flatSubLessons[currentIndex + 1];
    goToSubLesson(next);

    const subId = next?.sub?.id;
    if (!token || !id || !subId) return;
    const alreadyCompleted = (completedSubLessonIds || []).some(
      (cid) => String(cid) === String(subId)
    );
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
  }, [
    hasNextLesson,
    flatSubLessons,
    currentIndex,
    goToSubLesson,
    token,
    id,
    completedSubLessonIds,
    fetchProgress,
  ]);

  /**
   * เลือก sub-lesson เริ่มต้นเมื่อเข้าเพจ:
   * - ถ้ามี slug ใน URL → ใช้อันนั้น (หาตรง slug ก่อน)
   * - ถ้าไม่มี slug → ใช้ slug ที่เคยเรียนค้างไว้จาก localStorage (sub-lesson เดิมล่าสุด)
   * - ถ้ายังไม่มีเลย → fallback เป็น sub-lesson แรกของคอร์ส
   *
   * ไม่พึ่งสถานะ progress (none / in_progress / completed) ในการเลือกบทเริ่มต้น
   */
  useEffect(() => {
    if (hasInitializedSelection) return;
    if (!router.isReady || !id || courseLoading) return;
    if (!flatSubLessons.length) return;

    const findBySlug = (slug) => {
      if (!slug) return null;
      // รองรับรูปแบบใหม่ (id-prefix) และรูปแบบเก่า (จากชื่ออย่างเดียว)
      const [idPrefix] = slug.split("-");
      let index = flatSubLessons.findIndex(
        (item) => idPrefix && String(item.sub?.id) === String(idPrefix)
      );
      if (index === -1) {
        index = flatSubLessons.findIndex((item) => slugifySubLesson(item.sub) === slug);
      }
      if (index === -1) return null;
      const item = flatSubLessons[index];
      return { ...item, index };
    };

    let target = findBySlug(subSlug);

    // ถ้าเข้าโดยไม่เจาะ slug (เช่น /courses/:id/learn) ให้ดู slug ล่าสุดจาก localStorage
    if (!target && typeof window !== "undefined") {
      try {
        const savedSlug = window.localStorage.getItem(`course:lastSubLesson:${id}`);
        if (savedSlug) {
          target = findBySlug(savedSlug);
        }
      } catch {
        // ignore storage errors
      }
    }

    // ถ้ายังไม่เจอเลย ให้ fallback เป็น sub-lesson แรกของคอร์ส
    if (!target) {
      target = { ...flatSubLessons[0] };
    }

    if (target) {
      goToSubLesson(target);
      setHasInitializedSelection(true);
    }
  }, [
    router.isReady,
    id,
    courseLoading,
    flatSubLessons,
    subSlug,
    hasInitializedSelection,
    goToSubLesson,
  ]);

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
      <main className="min-h-screen bg-white">
        <div className="w-full max-w-[375px] md:max-w-[768px] lg:max-w-[1440px] mx-auto px-4 pt-4 md:pt-6 md:px-6 lg:px-[10vw] xl:px-[160px] lg:pt-[100px]">
          <section
            className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-6"
            aria-label="Course learning"
          >
            <CourseProgress
              courseName={course.course_name}
              courseSummary={course.course_summary}
              progressPercent={progressPercent}
              lessons={lessons}
              materials={materials}
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
                videoUrl={selectedSubLesson?.sub?.vdo_url ?? null}
                videoSectionRef={videoSectionRef}
                contentType={selectedSubLesson?.sub?.content_type ?? "video"}
                content={selectedSubLesson?.sub?.content ?? null}
                subLessonId={selectedSubLesson?.sub?.id ?? null}
                onMarkComplete={handleMarkComplete}
                token={token}
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

