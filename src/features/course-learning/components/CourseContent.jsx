"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/common/navbar/Button";

export default function CourseContent({
  subLessonName,
  courseCoverImageUrl,
  assignmentQuestion = "What are the 4 elements of service design?",
  assignmentStatus = "Pending",
  videoSectionRef,
  contentType = "video",
  content = null,
  subLessonId = null,
  onMarkComplete,
  className = "",
}) {
  const [answer, setAnswer] = useState("");
  const scrollCompleteSentinelRef = useRef(null);
  const textContentContainerRef = useRef(null);
  const hasMarkedCompleteRef = useRef(false);

  const title = subLessonName || "Select a lesson";
  const showPlaceholder = !subLessonName;
  const isTextType = contentType === "text";
  const isVideoType = !isTextType;

  useEffect(() => {
    hasMarkedCompleteRef.current = false;
  }, [subLessonId]);

  useEffect(() => {
    if (!isTextType || !subLessonId || !onMarkComplete) return;
    const sentinel = scrollCompleteSentinelRef.current;
    const root = textContentContainerRef.current;
    if (!sentinel || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || hasMarkedCompleteRef.current) return;
        hasMarkedCompleteRef.current = true;
        onMarkComplete(subLessonId);
      },
      { threshold: 0, root, rootMargin: "0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isTextType, subLessonId, onMarkComplete]);

  const handleMarkCompleteClick = () => {
    if (subLessonId && onMarkComplete) onMarkComplete(subLessonId);
  };

  return (
    <article
      className={`flex flex-col items-start pt-[15px] gap-8 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:pt-0 lg:gap-[25px] mx-auto ${className}`}
      aria-label="Lesson content"
    >
      <header className="w-full flex-none order-0 self-stretch">
        <h1 className="headline3 lg:headline2 text-black w-full">
          {title}
        </h1>
      </header>

      {isVideoType && (
        <section
          ref={videoSectionRef}
          className="w-full flex-none order-1 self-stretch"
          aria-label="Video"
        >
          <div className="relative w-full aspect-video max-h-[213.5px] md:max-h-[320px] lg:max-h-[460px] rounded-[8px] overflow-hidden bg-gray-300">
            {courseCoverImageUrl ? (
              <img
                src={courseCoverImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" aria-hidden />
            )}
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <div className="w-[52px] h-[52px] rounded-full bg-black/50 flex items-center justify-center">
                <span className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-0.5" aria-hidden />
              </div>
            </div>
          </div>
          {!showPlaceholder && subLessonId && onMarkComplete && (
            <div className="w-full flex justify-start mt-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleMarkCompleteClick}
                className="body2 rounded-xl"
              >
                Mark as complete
              </Button>
            </div>
          )}
          {isVideoType && content && (
            <section
              className="w-full flex-none order-1 self-stretch mt-6 rounded-[8px] border border-gray-300 bg-white p-4 max-h-[320px] overflow-y-auto"
              aria-label="Lesson article"
            >
              <div className="body2 text-black prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            </section>
          )}
        </section>
      )}

      {isTextType && (
        <section
          ref={(el) => {
            textContentContainerRef.current = el;
            if (videoSectionRef) videoSectionRef.current = el;
          }}
          className="w-full flex-none order-1 self-stretch rounded-[8px] border border-gray-300 bg-white p-4 max-h-[400px] overflow-y-auto"
          aria-label="Lesson article"
        >
          {content ? (
            <>
              <div className="body2 text-black prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
              <div ref={scrollCompleteSentinelRef} className="h-2 w-full" aria-hidden />
            </>
          ) : (
            <p className="body2 text-gray-600">No content for this lesson.</p>
          )}
        </section>
      )}

      <section
        className="flex flex-col items-start p-4 gap-4 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:p-6 lg:gap-[25px] flex-none order-2 self-stretch bg-blue-100 rounded-[8px]"
        aria-labelledby="assignment-heading"
      >
        <header className="flex flex-row justify-between items-start gap-4 w-full">
          <h2 id="assignment-heading" className="body1 text-black flex-1 min-w-0">
            Assignment
          </h2>
          <span className="px-2 py-1 rounded-[4px] bg-[#FFFBDB] body2 font-medium text-[#996500] shrink-0">
            {assignmentStatus}
          </span>
        </header>

        {!showPlaceholder && (
          <>
            <p className="body2 text-black w-full">
              {assignmentQuestion}
            </p>

            <div className="flex flex-col items-start gap-2 w-full">
        
              <textarea
                id="assignment-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer..."
                rows={4}
                className="w-full py-3 pr-4 pl-3 rounded-[8px] border border-gray-400 bg-white body2 text-black placeholder:text-gray-600 resize-y min-h-[96px]"
              />
            </div>

            <div className="flex flex-col items-start gap-2 w-full lg:flex-row lg:justify-between lg:items-center lg:gap-[25px]">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full lg:w-[203px] body2 h-[60px] rounded-xl shrink-0"
              >
                Send Assignment
              </Button>
  
            </div>
          </>
        )}

        {showPlaceholder && (
          <p className="body2 text-gray-600">
            Select a sub-lesson from the sidebar to see the assignment.
          </p>
        )}
      </section>
    </article>
  );
}
