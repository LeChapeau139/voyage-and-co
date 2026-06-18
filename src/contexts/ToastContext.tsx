'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  id: number
  message: string
  type: ToastType
  exiting: boolean
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const BG: Record<ToastType, string> = {
  success: '#C2714A',
  error:   '#DC5E4A',
  info:    '#6B8AAF',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string, type: ToastType) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const id = Date.now()
    setState({ id, message, type, exiting: false })
    timerRef.current = setTimeout(() => {
      setState(prev => prev?.id === id ? { ...prev, exiting: true } : prev)
      setTimeout(() => setState(prev => prev?.id === id ? null : prev), 300)
    }, 3000)
  }, [])

  const toast = {
    success: (m: string) => show(m, 'success'),
    error:   (m: string) => show(m, 'error'),
    info:    (m: string) => show(m, 'info'),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {state && (
        <div
          className={state.exiting
            ? 'animate-[toastSlideUp_0.3s_ease-in_forwards]'
            : 'animate-[toastSlideDown_0.28s_ease-out_forwards]'
          }
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            left: '50%',
            zIndex: 200,
            background: BG[state.type],
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 600,
            maxWidth: '85vw',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
          }}
        >
          {state.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
