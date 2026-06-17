'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trip } from '@/lib/types'
import CreateTripModal from './CreateTripModal'

export default function VoyagesPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchTrips = async () => {
    const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
    setTrips(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTrips() }, [])

  const setActive = async (tripId: string) => {
    await supabase.from('trips').update({ is_active: false }).neq('id', tripId)
    await supabase.from('trips').update({ is_active: true }).eq('id', tripId)
    fetchTrips()
  }

  return (
    <div className="px-5 pt-14">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Mes aventures</p>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Voyages</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg shadow-orange-900/20 transition active:scale-95"
          style={{ background: '#C2714A' }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-3xl" style={{ background: '#F0E8DC' }} />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="mt-24 flex flex-col items-center gap-3 text-center">
          <div className="text-6xl mb-2">🗺️</div>
          <p className="text-lg font-semibold" style={{ color: '#2C2416' }}>Aucun voyage pour l&apos;instant</p>
          <p className="text-sm" style={{ color: '#8A7B6A' }}>Commence par créer ton premier voyage</p>
          <button onClick={() => setShowModal(true)}
            className="mt-3 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/20"
            style={{ background: '#C2714A' }}
          >
            Créer un voyage
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trips.map((trip) => (
            <div key={trip.id}
              className="overflow-hidden rounded-3xl"
              style={{
                background: trip.is_active ? 'linear-gradient(135deg, #C2714A 0%, #A85C38 100%)' : '#FFFFFF',
                boxShadow: trip.is_active ? '0 8px 32px rgba(194,113,74,0.3)' : '0 2px 12px rgba(44,36,22,0.06)',
              }}
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  {trip.is_active ? (
                    <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white">
                      ✈️ En cours
                    </span>
                  ) : (
                    <button onClick={() => setActive(trip.id)}
                      className="rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95"
                      style={{ borderColor: '#E8DFD0', color: '#8A7B6A', background: '#F7F2EA' }}
                    >
                      Activer
                    </button>
                  )}
                  {trip.start_date && (
                    <span className={`text-xs font-medium ${trip.is_active ? 'text-white/70' : 'text-[#B5A89A]'}`}>
                      {new Date(trip.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <h2 className={`text-xl font-bold ${trip.is_active ? 'text-white' : ''}`} style={{ color: trip.is_active ? undefined : '#2C2416' }}>
                  {trip.name}
                </h2>
                {trip.destination && (
                  <p className={`mt-0.5 text-sm ${trip.is_active ? 'text-white/75' : ''}`} style={{ color: trip.is_active ? undefined : '#8A7B6A' }}>
                    📍 {trip.destination}
                  </p>
                )}
                {trip.description && (
                  <p className={`mt-2 text-sm line-clamp-2 ${trip.is_active ? 'text-white/60' : ''}`} style={{ color: trip.is_active ? undefined : '#B5A89A' }}>
                    {trip.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateTripModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); fetchTrips() }} />
      )}
    </div>
  )
}
