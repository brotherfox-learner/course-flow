"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/common/accordion";

const SUB_LESSON_STATUS = {
  notStarted: "not_started",
  inProgress: "in_progress",
  completed: "completed",
};

function isCompletedKey(completedSubLessonKeys, key, subId) {
  if (!completedSubLessonKeys) return false;
  if (typeof completedSubLessonKeys.has === "function") return completedSubLessonKeys.has(key) || (subId != null && completedSubLessonKeys.has(String(subId)));
  if (Array.isArray(completedSubLessonKeys)) return completedSubLessonKeys.includes(key) || (subId != null && completedSubLessonKeys.includes(String(subId)));
  return false;
}

function isInProgressKey(inProgressSubLessonKeys, key, subId) {
  if (!inProgressSubLessonKeys) return false;
  if (typeof inProgressSubLessonKeys.has === "function") return inProgressSubLessonKeys.has(key) || (subId != null && inProgressSubLessonKeys.has(String(subId)));
  if (Array.isArray(inProgressSubLessonKeys)) return inProgressSubLessonKeys.includes(key) || (subId != null && inProgressSubLessonKeys.includes(String(subId)));
  return false;
}

function SubLessonIcon({ status }) {
  if (status === SUB_LESSON_STATUS.completed) {
    return (
      <img
        src="/complete.svg"
        alt="Completed lesson"
        className="w-5 h-5 shrink-0 object-contain"
        aria-hidden
      />
    );
  }
  if (status === SUB_LESSON_STATUS.inProgress) {
    return (
      <img
        src="/haft-complete.svg"
        alt="Lesson in progress"
        className="w-5 h-5 shrink-0 object-contain"
        aria-hidden
      />
    );
  }
  return (
    <img
      src="/not-start.svg"
      alt="Not started"
      className="w-5 h-5 shrink-0 object-contain"
      aria-hidden
    />
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(0)} mb` : `${Math.round(bytes / 1024)} KB`;
}

export default function CourseProgress({
  courseName,
  courseSummary,
  progressPercent = 0,
  lessons = [],
  materials = [],
  completedSubLessonKeys,
  inProgressSubLessonKeys,
  currentSubLessonKey = null,
  onSubLessonClick,
  className = "",
}) {
  const completedSet = completedSubLessonKeys ?? new Set();
  const inProgressSet = inProgressSubLessonKeys ?? new Set();
  const percent = Math.min(100, Math.max(0, Number(progressPercent) || 0));

  const [userOpenLessonValue, setUserOpenLessonValue] = useState(null);
  const currentItemRef = useRef(null);

  // หาว่า current sub-lesson อยู่ใน lesson ไหน เพื่อเปิด panel นั้นโดยอัตโนมัติ
  const currentLessonValue = useMemo(() => {
    if (!lessons || !lessons.length || !currentSubLessonKey) return null;

    for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex += 1) {
      const subLessons = lessons[lessonIndex].sub_lessons || [];
      for (let subIndex = 0; subIndex < subLessons.length; subIndex += 1) {
        const sub = subLessons[subIndex];
        const key = `${lessonIndex}-${sub.id ?? subIndex}`;
        if (
          key === currentSubLessonKey ||
          (sub.id != null && String(sub.id) === String(currentSubLessonKey))
        ) {
          return `lesson-${lessonIndex}`;
        }
      }
    }
    return null;
  }, [lessons, currentSubLessonKey]);

  const accordionValue = userOpenLessonValue ?? currentLessonValue ?? "lesson-0";

  // เลื่อน sidebar ให้ sub-lesson ปัจจุบันอยู่ในมุมมอง
  useEffect(() => {
    if (!currentItemRef.current) return;
    try {
      currentItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    } catch {
      // ignore scroll errors
    }
  }, [currentSubLessonKey]);

  return (
    <aside
      className={`flex flex-col items-start p-4 gap-4 w-full max-w-[343px] mx-auto bg-white rounded-[8px] shadow-[4px_4px_24px_rgba(0,0,0,0.08)] box-border lg:max-w-none lg:w-[357px] lg:shrink-0 lg:p-8 lg:px-6 lg:gap-6 ${className}`}
      aria-label="Course progress"
    >
      <span className="body4 lg:body3 text-orange-500 w-full flex-none order-0 self-stretch">
        Course
      </span>

      <header className="flex flex-col items-start p-0 gap-2 w-full flex-none order-1 self-stretch">
        <h2 className="body2 lg:headline3 text-black w-full flex-none order-0 self-stretch">
          {courseName || "Course Title"}
        </h2>
        <p className="body4 lg:body2 text-gray-700 line-clamp-2 w-full flex-none order-1 self-stretch">
          {courseSummary || ""}
        </p>
      </header>

      <section className="flex flex-col items-start p-0 gap-2 w-full flex-none order-2 self-stretch" aria-label="Progress">
        <p className="body4 lg:body3 text-gray-700 w-full">
          {percent}% Complete
        </p>
        <div className="relative w-full h-[10px] bg-gray-300 rounded-[99px] overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-[99px] bg-[linear-gradient(109.54deg,#95BEFF_18.21%,#0040E6_95.27%)]"
            style={{ width: `${percent}%` }}
            aria-hidden
          />
        </div>
      </section>

      <Accordion
        type="single"
        collapsible
        value={accordionValue}
        onValueChange={(val) => setUserOpenLessonValue(val || null)}
        className="w-full flex flex-col gap-0 flex-none order-3 self-stretch border-0"
      >
        {lessons.map((lesson, lessonIndex) => {
          const subLessons = lesson.sub_lessons || [];
          const value = `lesson-${lessonIndex}`;
          const numberLabel = String(lessonIndex + 1).padStart(2, "0");
          const lessonTitle = (lesson.name || "").replace(/^\d{2}\s+/, "") || lesson.name || `Lesson ${lessonIndex + 1}`;

          return (
            <AccordionItem
              key={value}
              value={value}
              className="w-full max-w-[311px] border-b border-gray-400 py-2 last:border-b last:mb-0"
            >
              <AccordionTrigger className="py-2 px-0 w-full hover:no-underline">
                <div className="flex flex-row items-start gap-6 min-w-0 flex-1">
                  <span className="body2 text-gray-700 shrink-0 w-[18px]">
                    {numberLabel}
                  </span>
                  <span className="body2 text-black flex-1 min-w-0 text-left">
                    {lessonTitle}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col items-start p-0">
                <ul className="flex flex-col w-full list-none p-0" role="list">
                  {subLessons.map((sub, subIndex) => {
                    const key = `${lessonIndex}-${sub.id ?? subIndex}`;
                    const isCompleted = isCompletedKey(completedSet, key, sub.id);
                    const isCurrent = currentSubLessonKey === key || currentSubLessonKey === String(sub.id);
                    const isInProgress = isInProgressKey(inProgressSet, key, sub.id);
                    const status = isCompleted
                      ? SUB_LESSON_STATUS.completed
                      : isCurrent || isInProgress
                        ? SUB_LESSON_STATUS.inProgress
                        : SUB_LESSON_STATUS.notStarted;

                    return (
                      <li key={key}>
                        <button
                          type="button"
                          ref={isCurrent ? currentItemRef : null}
                          onClick={() => onSubLessonClick?.(lesson, sub, lessonIndex, subIndex)}
                          className={`w-full flex flex-row items-center p-2 gap-4 rounded-[8px] text-left min-h-[37px] ${
                            isCurrent ? "bg-gray-100" : ""
                          }`}
                        >
                          <SubLessonIcon status={status} />
                          <span className="body3 text-gray-700 flex-1 min-w-0">
                            {sub.name || ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
        {materials.length > 0 && (
          <AccordionItem
            value="attachment"
            className="w-full max-w-[311px] border-b border-gray-400 py-2 last:border-b last:mb-0"
          >
            <AccordionTrigger className="py-2 px-0 w-full hover:no-underline ">
              <div className="flex flex-row items-start gap-6 min-w-0 flex-1">
                <img src="/folder-open.png" alt="" className=" w-[18px] h-[18px] shrink-0 object-contain my-auto" aria-hidden />
                <span className="body2 text-black flex-1 min-w-0 text-left">
                  Attachment
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col items-start p-0">
              <ul className="flex flex-col w-full list-none p-0 gap-2" role="list">
                {materials.map((material) => (
                  <li key={material.id}>
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 w-full h-[82px] min-w-0 px-4 bg-blue-100 rounded-[8px] hover:opacity-90 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-[4px] bg-white flex items-center justify-center shrink-0">
                        <img src="/file2.svg" alt="" className="w-5 h-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] text-black font-medium truncate">
                          {material.title || material.file_name}
                        </p>
                        {material.file_size && (
                          <p className="text-[12px] text-blue-500 mt-0.5">
                            {formatFileSize(material.file_size)}
                          </p>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </aside>
  );
}
