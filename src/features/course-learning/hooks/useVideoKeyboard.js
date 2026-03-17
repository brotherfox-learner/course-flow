import { useEffect, useCallback, useRef, useState } from "react"

const SEEK_STEP_SECONDS = 5

/**
 * Handles keyboard seeking (ArrowLeft / ArrowRight) and skip indicator display.
 *
 * @param {React.RefObject} videoRef
 * @param {boolean} isVideoType
 * @param {string|null} videoUrl
 * @returns {{ skipIndicator }}
 */
export function useVideoKeyboard(videoRef, isVideoType, videoUrl) {
  const [skipIndicator, setSkipIndicator] = useState(null)
  const skipIndicatorTimerRef = useRef(null)

  const handleSkip = useCallback(
    (deltaSeconds) => {
      const el = videoRef.current
      if (!el) return
      const duration = el.duration || 0
      if (!duration || !Number.isFinite(duration)) return
      const next = Math.min(duration, Math.max(0, (el.currentTime || 0) + deltaSeconds))
      el.currentTime = next

      setSkipIndicator(deltaSeconds > 0 ? "forward" : "backward")
      if (skipIndicatorTimerRef.current) clearTimeout(skipIndicatorTimerRef.current)
      skipIndicatorTimerRef.current = setTimeout(() => setSkipIndicator(null), 2000)
    },
    [videoRef]
  )

  useEffect(() => {
    if (!isVideoType || !videoUrl) return

    const onKeyDown = (event) => {
      const active = document.activeElement
      const tag = active?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || active?.isContentEditable) return
      if (event.key === "ArrowRight") {
        event.preventDefault()
        handleSkip(SEEK_STEP_SECONDS)
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        handleSkip(-SEEK_STEP_SECONDS)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isVideoType, videoUrl, handleSkip])

  useEffect(() => {
    return () => {
      if (skipIndicatorTimerRef.current) clearTimeout(skipIndicatorTimerRef.current)
    }
  }, [])

  return { skipIndicator }
}
