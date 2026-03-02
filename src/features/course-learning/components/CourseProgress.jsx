"use client";

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

export default function CourseProgress({
  courseName,
  courseSummary,
  progressPercent = 0,
  lessons = [],
  completedSubLessonKeys,
  inProgressSubLessonKeys,
  currentSubLessonKey = null,
  onSubLessonClick,
  className = "",
}) {
  const completedSet = completedSubLessonKeys ?? new Set();
  const inProgressSet = inProgressSubLessonKeys ?? new Set();
  const percent = Math.min(100, Math.max(0, Number(progressPercent) || 0));

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

      <Accordion type="single" collapsible defaultValue="lesson-0" className="w-full flex flex-col gap-0 flex-none order-3 self-stretch border-0">
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
      </Accordion>
    </aside>
  );
}
