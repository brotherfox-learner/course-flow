"use client";

import { useRef, useEffect } from "react";
import VideoSection from "./VideoSection";
import AssignmentPanel from "./AssignmentPanel";
import { useVideoProgress } from "../hooks/useVideoProgress";
import { useVideoCompletion } from "../hooks/useVideoCompletion";
import { useVideoKeyboard } from "../hooks/useVideoKeyboard";
import { useSubLessonAssignment } from "../hooks/useSubLessonAssignment";

export default function CourseContent({
  subLessonName,
  courseCoverImageUrl,
  videoUrl = null,
  videoSectionRef,
  contentType = "video",
  content = null,
  subLessonId = null,
  onMarkComplete,
  token = null,
  className = "",
}) {
  const title = subLessonName || "Select a lesson";
  const showPlaceholder = !subLessonName;
  const isTextType = contentType === "text";
  const isVideoType = !isTextType;

  // Completion sentinel refs (shared between video and assignment hooks)
  const hasMarkedCompleteRef = useRef(false);
  const contentCompletedRef = useRef(false);
  const videoMarkCompleteSentRef = useRef(false);

  const scrollCompleteSentinelRef = useRef(null);
  const textContentContainerRef = useRef(null);

  // Reset all sentinels when sub-lesson changes
  useEffect(() => {
    hasMarkedCompleteRef.current = false;
    contentCompletedRef.current = false;
    videoMarkCompleteSentRef.current = false;
  }, [subLessonId]);

  // ── Assignment (one-question-at-a-time) ───────────────────────────────────

  const assignment = useSubLessonAssignment(
    subLessonId,
    token,
    onMarkComplete,
    hasMarkedCompleteRef,
    contentCompletedRef
  );

  // ── Video hooks ───────────────────────────────────────────────────────────

  const {
    videoRef,
    onLoadedMetadata,
    onTimeUpdate: onTimeUpdateProgress,
    onPause,
    onEnded: onEndedProgress,
  } = useVideoProgress(subLessonId, token);

  const { onTimeUpdateCompletion, onEndedCompletion } = useVideoCompletion({
    subLessonId,
    onMarkComplete,
    hasAssignment: assignment.hasAssignment,
    isSubmittedOrGraded: assignment.isSubmittedOrGraded,
    hasMarkedCompleteRef,
    contentCompletedRef,
    videoMarkCompleteSentRef,
  });

  const { skipIndicator } = useVideoKeyboard(videoRef, isVideoType, videoUrl);

  // ── Text completion via IntersectionObserver ──────────────────────────────

  useEffect(() => {
    if (!isTextType || !subLessonId || !onMarkComplete) return;
    const sentinel = scrollCompleteSentinelRef.current;
    const root = textContentContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || contentCompletedRef.current) return;
        contentCompletedRef.current = true;
        if (!assignment.hasAssignment) {
          if (!hasMarkedCompleteRef.current) {
            hasMarkedCompleteRef.current = true;
            onMarkComplete(subLessonId);
          }
        } else if (assignment.isSubmittedOrGraded && !hasMarkedCompleteRef.current) {
          hasMarkedCompleteRef.current = true;
          onMarkComplete(subLessonId);
        }
      },
      { threshold: 0, root, rootMargin: "0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isTextType, subLessonId, onMarkComplete, assignment.hasAssignment, assignment.isSubmittedOrGraded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Combined video event handlers ─────────────────────────────────────────

  const handleTimeUpdate = (e) => {
    const { currentTime, duration } = e.currentTarget;
    onTimeUpdateProgress(e);
    onTimeUpdateCompletion(currentTime, duration);
  };

  const handleEnded = (e) => {
    onEndedProgress(e);
    onEndedCompletion();
  };

  return (
    <article
      className={`flex flex-col items-start pt-[15px] gap-8 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:pt-0 lg:gap-[25px] mx-auto ${className}`}
      aria-label="Lesson content"
    >
      <header className="w-full flex-none order-0 self-stretch">
        <h1 className="headline3 lg:headline2 text-black w-full">{title}</h1>
      </header>

      {isVideoType && (
        <VideoSection
          videoUrl={videoUrl}
          title={title}
          courseCoverImageUrl={courseCoverImageUrl}
          videoRef={videoRef}
          skipIndicator={skipIndicator}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPause={onPause}
          onEnded={handleEnded}
          content={content}
          videoSectionRef={videoSectionRef}
        />
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
              <div
                className="body2 text-black prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
              <div ref={scrollCompleteSentinelRef} className="h-2 w-full" aria-hidden />
            </>
          ) : (
            <p className="body2 text-gray-600">No content for this lesson.</p>
          )}
        </section>
      )}

      {(!showPlaceholder && !assignment.assignmentLoading && !assignment.hasAssignment) ? null : (
      <AssignmentPanel
        showPlaceholder={showPlaceholder}
        assignmentLoading={assignment.assignmentLoading}
        hasAssignment={assignment.hasAssignment}
        questions={assignment.questions}
        currentQuestionIndex={assignment.currentQuestionIndex}
        currentQuestion={assignment.currentQuestion}
        isCurrentAnswered={assignment.isCurrentAnswered}
        submissionDisplay={assignment.submissionDisplay}
        gradingResults={assignment.gradingResults}
        isSubmittedOrGraded={assignment.isSubmittedOrGraded}
        submitting={assignment.submitting}
        submitError={assignment.submitError}
        retrying={assignment.retrying}
        retryError={assignment.retryError}
        getAns={assignment.getAns}
        onToggleOption={assignment.toggleOption}
        onSetTextAnswer={assignment.setTextAns}
        onSubmit={assignment.handleSubmitCurrentQuestion}
        onRetry={assignment.handleRetry}
        onPrevQuestion={assignment.handlePrevQuestion}
        onNextQuestion={assignment.handleNextQuestion}
        onNavigateToQuestion={assignment.handleNavigateToQuestion}
      />
      )}
    </article>
  );
}
