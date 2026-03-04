"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Button from "@/common/navbar/Button";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "text-[#996500] bg-[#FFFBDB] px-2 py-1 rounded-[4px]",
  },
  inprogress: {
    label: "In progress",
    className: "text-[#3557CF] bg-[#EBF0FF] px-2 py-1 rounded-[4px]",
  },
  submitted: {
    label: "Submitted",
    className: "text-green-600 bg-green-50 px-2 py-1 rounded-[4px]",
  },
  graded: {
    label: "Graded",
    className: "text-blue-600 bg-blue-50 px-2 py-1 rounded-[4px]",
  },
};

function getStatusDisplay(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

const DEBOUNCE_MS = 1500;

export default function CourseContent({
  subLessonName,
  courseCoverImageUrl,
  videoSectionRef,
  contentType = "video",
  content = null,
  subLessonId = null,
  onMarkComplete,
  token = null,
  className = "",
}) {
  const scrollCompleteSentinelRef = useRef(null);
  const textContentContainerRef = useRef(null);
  const hasMarkedCompleteRef = useRef(false);

  const title = subLessonName || "Select a lesson";
  const showPlaceholder = !subLessonName;
  const isTextType = contentType === "text";
  const isVideoType = !isTextType;

  const [assignmentData, setAssignmentData] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [gradingResults, setGradingResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  const saveDraftTimerRef = useRef(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

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

  useEffect(() => {
    if (!subLessonId || !token) {
      setAssignmentData(null);
      setAnswers({});
      setGradingResults(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setAssignmentLoading(true);
      setGradingResults(null);
      setSubmitError("");
      setRetryError("");
      try {
        const res = await fetch(`/api/sub-lessons/${subLessonId}/assignment`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        if (!data.hasAssignment) {
          setAssignmentData(null);
          setAnswers({});
          return;
        }

        setAssignmentData(data);

        const init = {};
        (data.questions || []).forEach((q) => {
          init[q.id] = { selected_option_ids: [], answer_text: "" };
        });

        if (data.existingAnswers?.length > 0) {
          data.existingAnswers.forEach((a) => {
            const ids = a.selected_option_ids || [];
            init[a.question_id] = {
              selected_option_ids: Array.isArray(ids) ? ids.map(Number) : [],
              answer_text: a.answer_text ?? "",
            };
          });
        }
        setAnswers(init);

        if (
          data.submission &&
          data.submission.is_correct != null &&
          data.questions?.length > 0
        ) {
          buildGradingFromExisting(data.questions, init, setGradingResults);
        }
      } catch {
        if (!cancelled) setAssignmentData(null);
      } finally {
        if (!cancelled) setAssignmentLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [subLessonId, token]);

  useEffect(() => {
    return () => {
      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
    };
  }, []);

  const saveDraft = useCallback(
    (newAnswers) => {
      if (!subLessonId || !token || !assignmentData?.hasAssignment) return;
      if (
        assignmentData.submission?.status === "submitted" ||
        assignmentData.submission?.status === "graded"
      )
        return;

      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);

      saveDraftTimerRef.current = setTimeout(async () => {
        const questions = assignmentData.questions || [];
        const payload = questions.map((q) => {
          const a = newAnswers[q.id] || {
            selected_option_ids: [],
            answer_text: "",
          };
          return {
            question_id: q.id,
            answer_text: q.question_type === "text" ? a.answer_text : null,
            selected_option_ids:
              q.question_type !== "text" ? a.selected_option_ids : [],
          };
        });
        try {
          await fetch(`/api/sub-lessons/${subLessonId}/assignment`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ answers: payload }),
          });
        } catch {
          // silent fail for draft save
        }
      }, DEBOUNCE_MS);
    },
    [subLessonId, token, assignmentData]
  );

  const getAns = (qId) =>
    answers[qId] || { selected_option_ids: [], answer_text: "" };

  const toggleOption = (qId, optId, qType) => {
    if (gradingResults?.[qId]) return;
    const optIdNum = Number(optId);
    setAnswers((prev) => {
      const cur = prev[qId] || { selected_option_ids: [], answer_text: "" };
      const hasOpt = cur.selected_option_ids.some(
        (i) => Number(i) === optIdNum
      );
      let ids;
      if (qType === "single_choice") {
        ids = hasOpt ? [] : [optIdNum];
      } else {
        ids = hasOpt
          ? cur.selected_option_ids.filter((i) => Number(i) !== optIdNum)
          : [...cur.selected_option_ids.map(Number), optIdNum];
      }
      const next = { ...prev, [qId]: { ...cur, selected_option_ids: ids } };
      saveDraft(next);
      return next;
    });
  };

  const setTextAns = (qId, text) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [qId]: {
          ...(prev[qId] || { selected_option_ids: [] }),
          answer_text: text,
        },
      };
      saveDraft(next);
      return next;
    });
  };

  const questions = assignmentData?.questions || [];
  const allAnswered = questions.every((q) => {
    const a = getAns(q.id);
    if (q.question_type === "text") return a.answer_text.trim().length > 0;
    return a.selected_option_ids.length > 0;
  });

  const handleSubmit = async () => {
    if (!allAnswered || submitting || !assignmentData?.assignmentId) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = questions.map((q) => {
        const a = getAns(q.id);
        return {
          question_id: q.id,
          answer_text: q.question_type === "text" ? a.answer_text : null,
          selected_option_ids:
            q.question_type !== "text" ? a.selected_option_ids : [],
        };
      });
      const res = await fetch(
        `/api/assignments/${assignmentData.assignmentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers: payload }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submit failed");

      const gr = {};
      for (const r of data.gradingResults) {
        if (r.option_results) {
          r.option_results = r.option_results.map((o) => ({
            ...o,
            option_id: Number(o.option_id),
          }));
        }
        gr[r.question_id] = r;
      }
      setGradingResults(gr);

      const anyChoiceWrong = data.gradingResults.some(
        (r) => r.question_type !== "text" && !r.is_correct
      );
      setAssignmentData((prev) => ({
        ...prev,
        submission: {
          ...prev.submission,
          status: anyChoiceWrong ? "inprogress" : "submitted",
          is_correct: !anyChoiceWrong,
        },
      }));
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (qId) => {
    if (!assignmentData?.assignmentId) return;
    setRetryError("");
    setRetrying(true);
    try {
      const res = await fetch(
        `/api/assignments/${assignmentData.assignmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question_id: qId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Retry failed");

      setGradingResults((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next[qId];
        return Object.keys(next).length === 0 ? null : next;
      });
      setAnswers((prev) => ({
        ...prev,
        [qId]: { selected_option_ids: [], answer_text: "" },
      }));
      setAssignmentData((prev) => ({
        ...prev,
        submission: {
          ...prev.submission,
          status: "inprogress",
          is_correct: null,
        },
      }));
    } catch (e) {
      setRetryError(e.message);
    } finally {
      setRetrying(false);
    }
  };

  const handleMarkCompleteClick = () => {
    if (subLessonId && onMarkComplete) onMarkComplete(subLessonId);
  };

  const submissionStatus = assignmentData?.submission?.status || "pending";
  const sc = getStatusDisplay(submissionStatus);

  const hasAssignment = assignmentData?.hasAssignment && questions.length > 0;

  const isSubmittedOrGraded =
    submissionStatus === "submitted" || submissionStatus === "graded";
  const showSubmitButton =
    !isSubmittedOrGraded ||
    (gradingResults &&
      !questions.every((q) => gradingResults?.[q.id]));

  return (
    <article
      className={`flex flex-col items-start pt-[15px] gap-8 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:pt-0 lg:gap-[25px] mx-auto ${className}`}
      aria-label="Lesson content"
    >
      <header className="w-full flex-none order-0 self-stretch">
        <h1 className="headline3 lg:headline2 text-black w-full">{title}</h1>
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
                alt="Course cover"
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
                <span
                  className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-0.5"
                  aria-hidden
                />
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
              <div
                className="body2 text-black prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
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
              <div
                className="body2 text-black prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
              <div
                ref={scrollCompleteSentinelRef}
                className="h-2 w-full"
                aria-hidden
              />
            </>
          ) : (
            <p className="body2 text-gray-600">No content for this lesson.</p>
          )}
        </section>
      )}

      {/* Assignment section */}
      {!showPlaceholder && (
        <section
          className="flex flex-col items-start p-4 gap-4 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:p-6 lg:gap-[25px] flex-none order-2 self-stretch bg-blue-100 rounded-[8px]"
          aria-labelledby="assignment-heading"
        >
          {assignmentLoading ? (
            <div className="flex justify-center w-full py-6">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasAssignment ? (
            <>
              <header className="flex flex-row justify-between items-start gap-4 w-full">
                <h2
                  id="assignment-heading"
                  className="body1 text-black flex-1 min-w-0"
                >
                  Assignment
                </h2>
                <span
                  className={`body2 font-medium shrink-0 ${sc.className}`}
                >
                  {sc.label}
                </span>
              </header>

              <div className="w-full border bg-white border-gray-200 rounded-xl overflow-hidden">
                <div className="p-5 space-y-6">
                  {questions.map((q, idx) => {
                    const ans = getAns(q.id);
                    const gr = gradingResults?.[q.id];
                    const isGraded = !!gr;
                    const isLocked =
                      isSubmittedOrGraded && !gradingResults;

                    return (
                      <div key={q.id}>
                        <p className="body2 font-medium text-gray-800 mb-3">
                          {questions.length > 1 ? `${idx + 1}. ` : ""}
                          {q.question_text}
                        </p>

                        {q.question_type === "text" && (
                          <div>
                            <textarea
                              value={ans.answer_text}
                              onChange={(e) => setTextAns(q.id, e.target.value)}
                              disabled={isGraded || isLocked}
                              rows={3}
                              placeholder="Answer..."
                              className="w-full py-3 pr-4 pl-3 rounded-[8px] border border-gray-400 bg-white body2 text-black placeholder:text-gray-600 resize-y min-h-[96px] focus:outline-none focus:border-blue-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                            />
                            {isGraded && (
                              <div className="mt-2 space-y-2">
                                <div
                                  className={`p-3 rounded-xl border ${
                                    gr.correct_text_answer
                                      ? "bg-green-50 border-green-200"
                                      : "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  <p
                                    className={`body3 font-medium mb-0.5 ${
                                      gr.correct_text_answer
                                        ? "text-green-700"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {gr.correct_text_answer
                                      ? "Model answer:"
                                      : "No model answer set"}
                                  </p>
                                  {gr.correct_text_answer && (
                                    <p className="body2 text-green-800">
                                      {gr.correct_text_answer}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="body2 text-gray-600">
                                    Want to try again?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRetry(q.id)}
                                    disabled={retrying}
                                    className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {retrying ? "Retrying..." : "Try again"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {(q.question_type === "single_choice" ||
                          q.question_type === "multiple_choice") && (
                          <div className="space-y-2">
                            {q.options.map((opt) => {
                              const selected =
                                ans.selected_option_ids.some(
                                  (id) => Number(id) === Number(opt.id)
                                );
                              const optResult = gr?.option_results?.find(
                                (r) =>
                                  Number(r.option_id) === Number(opt.id)
                              );

                              let optStyle =
                                "border-gray-200 bg-white text-gray-700";
                              if (isGraded && optResult) {
                                if (
                                  optResult.was_selected &&
                                  optResult.is_correct
                                )
                                  optStyle =
                                    "border-green-500 bg-green-50 text-green-700";
                                else if (
                                  optResult.was_selected &&
                                  !optResult.is_correct
                                )
                                  optStyle =
                                    "border-red-400 bg-red-50 text-red-600";
                                else if (
                                  !optResult.was_selected &&
                                  optResult.is_correct &&
                                  gr.is_correct
                                )
                                  optStyle =
                                    "border-green-200 bg-green-50/40 text-green-600";
                                else
                                  optStyle =
                                    "border-gray-100 bg-gray-50 text-gray-400";
                              } else if (
                                !isGraded &&
                                !isLocked &&
                                selected
                              ) {
                                optStyle =
                                  "border-blue-500 bg-blue-50 text-blue-700";
                              }

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={isGraded || isLocked}
                                  onClick={() =>
                                    toggleOption(
                                      q.id,
                                      opt.id,
                                      q.question_type
                                    )
                                  }
                                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all body2 ${optStyle} disabled:cursor-default`}
                                >
                                  {opt.option_text}
                                  {isGraded &&
                                    gr.is_correct &&
                                    !optResult?.was_selected &&
                                    optResult?.is_correct && (
                                      <span className="ml-2 text-green-500 text-[11px] font-medium">
                                        ✓ correct
                                      </span>
                                    )}
                                </button>
                              );
                            })}

                            {isGraded &&
                              q.question_type === "single_choice" &&
                              !gr.is_correct && (
                                <div className="flex items-center justify-between pt-1">
                                  <span className="body2 text-red-500 font-medium">
                                    ✗ Incorrect
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRetry(q.id)}
                                    disabled={retrying}
                                    className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {retrying ? "Retrying..." : "Try again"}
                                  </button>
                                </div>
                              )}
                            {isGraded &&
                              q.question_type === "single_choice" &&
                              gr.is_correct && (
                                <p className="body2 text-green-600 font-medium pt-1">
                                  ✓ Correct!
                                </p>
                              )}
                            {isGraded &&
                              q.question_type === "multiple_choice" &&
                              !gr.is_correct && (
                                <div className="flex items-center justify-between pt-1">
                                  <span className="body2 text-orange-500 font-medium">
                                    Some answers need review
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRetry(q.id)}
                                    disabled={retrying}
                                    className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {retrying ? "Retrying..." : "Try again"}
                                  </button>
                                </div>
                              )}
                            {isGraded &&
                              q.question_type === "multiple_choice" &&
                              gr.is_correct && (
                                <p className="body2 text-green-600 font-medium pt-1">
                                  ✓ All correct!
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
                  {(submitError || retryError) && (
                    <p className="body3 text-red-500 flex-1">
                      {submitError || retryError}
                    </p>
                  )}
                  <div className="flex items-center gap-4 ml-auto">
                    {showSubmitButton && (
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!allAnswered || submitting}
                        className="body2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Send Assignment"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <header className="flex flex-row justify-between items-start gap-4 w-full">
                <h2
                  id="assignment-heading"
                  className="body1 text-black flex-1 min-w-0"
                >
                  Assignment
                </h2>
              </header>
              <p className="body2 text-gray-600">
                No assignment for this lesson.
              </p>
            </>
          )}
        </section>
      )}

      {showPlaceholder && (
        <section
          className="flex flex-col items-start p-4 gap-4 w-full max-w-[343px] md:max-w-[520px] lg:max-w-full lg:p-6 lg:gap-[25px] flex-none order-2 self-stretch bg-blue-100 rounded-[8px]"
          aria-labelledby="assignment-heading"
        >
          <header className="flex flex-row justify-between items-start gap-4 w-full">
            <h2
              id="assignment-heading"
              className="body1 text-black flex-1 min-w-0"
            >
              Assignment
            </h2>
          </header>
          <p className="body2 text-gray-600">
            Select a sub-lesson from the sidebar to see the assignment.
          </p>
        </section>
      )}
    </article>
  );
}

function buildGradingFromExisting(questions, initAnswers, setGradingResults) {
  const grading = {};
  for (const q of questions) {
    const ans = initAnswers[q.id] || {
      selected_option_ids: [],
      answer_text: "",
    };
    const selectedIds = (ans.selected_option_ids || []).map(Number);
    if (q.question_type === "text") {
      grading[q.id] = {
        question_id: q.id,
        question_type: "text",
        is_correct: true,
        correct_text_answer: q.correct_text_answer ?? null,
      };
    } else {
      const options = q.options || [];
      const correctIds = options
        .filter((o) => o.is_correct)
        .map((o) => Number(o.id));
      const allCorrectSelected = correctIds.every((cid) =>
        selectedIds.includes(cid)
      );
      const noWrongSelected = selectedIds.every((sid) =>
        correctIds.includes(sid)
      );
      const is_correct =
        q.question_type === "single_choice"
          ? selectedIds.length === 1 && correctIds.includes(selectedIds[0])
          : allCorrectSelected && noWrongSelected;
      grading[q.id] = {
        question_id: q.id,
        question_type: q.question_type,
        is_correct,
        correct_option_ids: correctIds,
        option_results: options.map((o) => ({
          option_id: Number(o.id),
          is_correct: !!o.is_correct,
          was_selected: selectedIds.includes(Number(o.id)),
        })),
      };
    }
  }
  setGradingResults(grading);
}
