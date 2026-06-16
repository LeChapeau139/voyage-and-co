'use client'

import { useState } from 'react'

export default function AutourDeMoiPage() {
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)

  const getLocation = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => setLoading(false),
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">🗺️</div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Autour de moi</h1>
      <p className="text-zinc-500 text-sm mb-8 max-w-xs">
        Découvre les restaurants, musées et lieux d'intérêt près de toi.
      </p>

      {position ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 w-full max-w-sm text-left">
          <p className="text-xs text-zinc-400 mb-1">Ta position</p>
          <p className="font-semibold text-zinc-900">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>
          <p className="text-sm text-zinc-500 mt-3">La carte et les suggestions arrivent à la prochaine étape ✨</p>
        </div>
      ) : (
        <button
          onClick={getLocation}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          )}
          {loading ? 'Localisation...' : 'Activer la géolocalisation'}
        </button>
      )}
    </div>
  )
}
