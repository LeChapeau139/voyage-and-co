'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const active = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      active.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!active.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 8) e.preventDefault()
  }, [])

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!active.current) return
    active.current = false
    const delta = (e.changedTouches[0]?.clientY ?? 0) - startY.current
    if (delta > 60) {
      setRefreshing(true)
      await onRefresh()
      setRefreshing(false)
    }
  }, [onRefresh])

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return { refreshing }
}
