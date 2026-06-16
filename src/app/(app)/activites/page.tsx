'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trip, Activity } from '@/lib/types'
import CreateActivityModal from './CreateActivityModal'

const TYPE_CONFIG = {
  food:      { emoji: '🍽️', label: 'Repas' },
  culture:   { emoji: '🏛️', label: 'Culture' },
  transport: { emoji: '🚌', label: 'Transport' },
  hotel:     { emoji: '🏨', label: 'Hébergement' },
  nature:    { emoji: '🌿', label: 'Nature' },
  other:     { emoji: '📌', label: 'Autre' },
}

export default function ActivitesPage() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchData = async () => {
    const { data: trip } = await supabase
      .from('trips')
      .select('*')
      .eq('is_active', true)
      .single()

    setActiveTrip(trip)

    if (trip) {
      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', trip.id)
        .order('scheduled_at', { ascending: true })
      setActivities(acts ?? [])
    }

    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const grouped = activities.reduce<Record<string, Activity[]>>((acc, act) => {
    const day = act.scheduled_at.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(act)
    return acc
  }, {})

  return (
    <div className="px-4 pt-12">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Activités</h1>
        {activeTrip && (
          <button
            onClick={() => setShowModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-100" />)}
        </div>
      ) : !activeTrip ? (
        <div className="mt-20 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">📅</span>
          <p className="font-semibold text-zinc-800">Aucun voyage actif</p>
          <p className="text-sm text-zinc-500">Active un voyage depuis l&apos;onglet Voyages</p>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-zinc-500">{activeTrip.name}</p>

          {Object.keys(grouped).length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <span className="text-5xl">🗓️</span>
              <p className="font-semibold text-zinc-800">Aucune activité</p>
              <p className="text-sm text-zinc-500">Ajoute ta première activité à ce voyage</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white"
              >
                Ajouter une activité
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(grouped).map(([day, acts]) => (
                <div key={day}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {formatDate(acts[0].scheduled_at)}
                  </p>
                  <div className="relative ml-2">
                    <div className="absolute left-[43px] top-0 h-full w-0.5 bg-zinc-100" />
                    <div className="flex flex-col gap-4">
                      {acts.map((act) => {
                        const cfg = TYPE_CONFIG[act.activity_type] ?? TYPE_CONFIG.other
                        return (
                          <div key={act.id} className="flex items-start gap-3">
                            <span className="w-10 shrink-0 text-right text-xs font-medium text-zinc-400 pt-2">
                              {formatTime(act.scheduled_at)}
                            </span>
                            <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-zinc-100">
                              {cfg.emoji}
                            </div>
                            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
                              <p className="font-semibold text-zinc-900">{act.title}</p>
                              {act.description && <p className="text-sm text-zinc-500">{act.description}</p>}
                              {act.location_name && (
                                <p className="mt-1 text-xs text-zinc-400">📍 {act.location_name}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && activeTrip && (
        <CreateActivityModal
          tripId={activeTrip.id}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchData() }}
        />
      )}
    </div>
  )
}
