'use client'

import { useState } from 'react'

export default function AutourDeMoiPage() {
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)

  const getLocation = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false) },
      () => setLoading(false),
    )
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Explorer</p>
        <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Autour de moi</h1>
      </div>

      {!position ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F5E8DF 0%, #EDD9C8 100%)' }}
          >
            🗺️
          </div>
          <div className="mt-2">
            <p className="text-lg font-semibold" style={{ color: '#2C2416' }}>Découvre les alentours</p>
            <p className="mt-1 max-w-xs text-sm" style={{ color: '#8A7B6A' }}>
              Restaurants, musées, lieux insolites — tout près de toi.
            </p>
          </div>
          <button onClick={getLocation} disabled={loading}
            className="mt-2 flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60"
            style={{ background: '#C2714A', boxShadow: '0 4px 20px rgba(194,113,74,0.35)' }}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : '📍'}
            {loading ? 'Localisation...' : 'Activer la géolocalisation'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl p-5 shadow-sm" style={{ background: '#F5E8DF' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#B5A89A' }}>Ta position</p>
            <p className="font-bold text-lg" style={{ color: '#2C2416' }}>
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
          </div>
          <div className="rounded-3xl p-5 text-center" style={{ background: '#F7F2EA' }}>
            <p className="text-3xl mb-2">🌴</p>
            <p className="font-semibold" style={{ color: '#2C2416' }}>Les suggestions arrivent</p>
            <p className="text-sm mt-1" style={{ color: '#8A7B6A' }}>Intégration avec Google Places à venir</p>
          </div>
        </div>
      )}
    </div>
  )
}
