import { useCallback, useRef } from "react"

const MIN_SWIPE_DISTANCE = 60

/**
 * Hook for swipe-to-change-tab on mobile.
 * Swipe left = next tab, swipe right = previous tab.
 *
 * @param {Array<{key: string}>} tabs - Array of tab objects with key
 * @param {string} activeTab - Current active tab key
 * @param {(key: string) => void} onTabChange - Called with new tab key
 * @returns {{ onTouchStart, onTouchMove, onTouchEnd }} Touch handlers to attach to content area
 */
export function useSwipeableTabs(tabs, activeTab, onTabChange) {
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  const onTouchStart = useCallback((e) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }, [])

  const onTouchMove = useCallback((e) => {
    touchEndX.current = e.targetTouches[0].clientX
  }, [])

  const onTouchEnd = useCallback(() => {
    if (touchStartX.current == null || touchEndX.current == null) return

    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE

    const currentIndex = tabs.findIndex((t) => t.key === activeTab)
    if (currentIndex === -1) return

    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1].key)
    } else if (isRightSwipe && currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1].key)
    }

    touchStartX.current = null
    touchEndX.current = null
  }, [tabs, activeTab, onTabChange])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
