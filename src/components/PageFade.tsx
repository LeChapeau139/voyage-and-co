'use client'

import { useEffect, useState } from 'react'

export default function PageFade({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.22s ease' }}>
      {children}
    </div>
  )
}
