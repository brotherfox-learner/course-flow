import { useRef } from "react"

const VIDEO_SAVE_THROTTLE_MS = 2000

/**
 * Handles saving and restoring video playback position.
 * Communicates with /api/sub-lessons/:subLessonId/time.
 *
 * @param {string|null} subLessonId
 * @param {string|null} token
 * @returns {{ videoRef, videoRestoredRef, videoSaveTimeLastRef, onLoadedMetadata, onTimeUpdate, onPause, onEnded }}
 */
export function useVideoProgress(subLessonId, token) {
  const videoRef = useRef(null)
  const videoRestoredRef = useRef(false)
  const videoSaveTimeLastRef = useRef(0)

  const savePosition = async (currentTime, duration) => {
    if (!token || !subLessonId || !duration) return
    try {
      await fetch(`/api/sub-lessons/${subLessonId}/time`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ positionSeconds: currentTime, durationSeconds: duration }),
      })
    } catch {
      // ignore
    }
  }

  const onLoadedMetadata = async (e) => {
    const el = e.currentTarget
    if (!subLessonId || videoRestoredRef.current || !token) return
    try {
      const res = await fetch(`/api/sub-lessons/${subLessonId}/time`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const t = data?.lastPositionSeconds
      if (typeof t === "number" && Number.isFinite(t) && t > 0 && t < (el.duration || Infinity)) {
        el.currentTime = t
        videoRestoredRef.current = true
      }
    } catch {
      // ignore
    }
  }

  const onTimeUpdate = async (e) => {
    const el = e.currentTarget
    const { currentTime, duration } = el
    if (token && subLessonId && duration > 0) {
      const now = Date.now()
      if (now - videoSaveTimeLastRef.current >= VIDEO_SAVE_THROTTLE_MS) {
        videoSaveTimeLastRef.current = now
        await savePosition(currentTime, duration)
      }
    }
  }

  const onPause = async (e) => {
    const el = e.currentTarget
    await savePosition(el.currentTime, el.duration)
  }

  const onEnded = async (e) => {
    const el = e.currentTarget
    await savePosition(el.currentTime, el.duration)
  }

  return {
    videoRef,
    videoRestoredRef,
    videoSaveTimeLastRef,
    onLoadedMetadata,
    onTimeUpdate,
    onPause,
    onEnded,
  }
}
