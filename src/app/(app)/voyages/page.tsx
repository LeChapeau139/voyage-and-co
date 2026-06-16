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
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
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
    <div className="px-4 pt-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Mes voyages</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">✈️</span>
          <p className="font-semibold text-zinc-800">Aucun voyage pour l&apos;instant</p>
          <p className="text-sm text-zinc-500">Crée ton premier voyage pour commencer</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white"
          >
            Créer un voyage
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition ${trip.is_active ? 'ring-indigo-300' : 'ring-zinc-100'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                {trip.is_active ? (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    En cours
                  </span>
                ) : (
                  <button
                    onClick={() => setActive(trip.id)}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-200"
                  >
                    Activer
                  </button>
                )}
                {trip.start_date && (
                  <span className="text-xs text-zinc-400">
                    {new Date(trip.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-zinc-900">{trip.name}</h2>
              {trip.destination && <p className="text-sm text-zinc-500">{trip.destination}</p>}
              {trip.description && <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{trip.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateTripModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchTrips() }}
        />
      )}
    </div>
  )
}
