/**
 * Returns callbacks that handle video-based lesson completion events.
 * The caller provides shared sentinel refs so assignment completion can also
 * update the same state.
 *
 * @param {object} params
 * @param {string|null}       params.subLessonId
 * @param {Function|null}     params.onMarkComplete
 * @param {boolean}           params.hasAssignment
 * @param {boolean}           params.isSubmittedOrGraded
 * @param {React.RefObject}   params.hasMarkedCompleteRef
 * @param {React.RefObject}   params.contentCompletedRef
 * @param {React.RefObject}   params.videoMarkCompleteSentRef
 */
export function useVideoCompletion({
  subLessonId,
  onMarkComplete,
  hasAssignment,
  isSubmittedOrGraded,
  hasMarkedCompleteRef,
  contentCompletedRef,
  videoMarkCompleteSentRef,
}) {
  const tryMarkComplete = () => {
    if (!subLessonId || !onMarkComplete || videoMarkCompleteSentRef.current) return
    if (!hasAssignment) {
      videoMarkCompleteSentRef.current = true
      if (!hasMarkedCompleteRef.current) {
        hasMarkedCompleteRef.current = true
        onMarkComplete(subLessonId)
      }
    } else if (isSubmittedOrGraded && !hasMarkedCompleteRef.current) {
      videoMarkCompleteSentRef.current = true
      hasMarkedCompleteRef.current = true
      onMarkComplete(subLessonId)
    }
  }

  const onTimeUpdateCompletion = (currentTime, duration) => {
    if (!subLessonId || !onMarkComplete || videoMarkCompleteSentRef.current) return
    if (!duration || duration <= 0) return
    const percent = (currentTime / duration) * 100
    if (percent >= 90) {
      if (contentCompletedRef.current) return
      contentCompletedRef.current = true
      tryMarkComplete()
    }
  }

  const onEndedCompletion = () => {
    if (!subLessonId || !onMarkComplete || videoMarkCompleteSentRef.current) return
    if (!contentCompletedRef.current) contentCompletedRef.current = true
    tryMarkComplete()
  }

  return { onTimeUpdateCompletion, onEndedCompletion }
}
