'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trip, Activity } from '@/lib/types'
import CreateActivityModal from './CreateActivityModal'

const TYPE_CONFIG = {
  food:      { emoji: '🍽️', color: '#FEF3C7', dot: '#F59E0B' },
  culture:   { emoji: '🏛️', color: '#E8F0E9', dot: '#6B8F71' },
  transport: { emoji: '🚌', color: '#E8EFF7', dot: '#6B8AAF' },
  hotel:     { emoji: '🏨', color: '#F3E8F5', dot: '#9B72A8' },
  nature:    { emoji: '🌿', color: '#E8F0E9', dot: '#6B8F71' },
  other:     { emoji: '📌', color: '#F7F2EA', dot: '#C2714A' },
}

export default function ActivitesPage() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchData = async () => {
    const { data: trip } = await supabase.from('trips').select('*').eq('is_active', true).single()
    setActiveTrip(trip)
    if (trip) {
      const { data: acts } = await supabase.from('activities').select('*').eq('trip_id', trip.id).order('scheduled_at', { ascending: true })
      setActivities(acts ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const grouped = activities.reduce<Record<string, Activity[]>>((acc, act) => {
    const day = act.scheduled_at.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(act)
    return acc
  }, {})

  return (
    <div className="px-5 pt-14">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Planning</p>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Activités</h1>
        </div>
        {activeTrip && (
          <button onClick={() => setShowModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg shadow-orange-900/20 transition active:scale-95"
            style={{ background: '#C2714A' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-3xl" style={{ background: '#F0E8DC' }} />)}
        </div>
      ) : !activeTrip ? (
        <div className="mt-24 flex flex-col items-center gap-3 text-center">
          <div className="text-6xl mb-2">🗓️</div>
          <p className="text-lg font-semibold" style={{ color: '#2C2416' }}>Aucun voyage actif</p>
          <p className="text-sm" style={{ color: '#8A7B6A' }}>Active un voyage depuis l&apos;onglet Voyages</p>
        </div>
      ) : (
        <>
          <div className="mb-6 mt-1 flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ background: '#F7F2EA' }}>
            <span className="text-sm">✈️</span>
            <p className="text-sm font-medium" style={{ color: '#8A7B6A' }}>{activeTrip.name}</p>
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <div className="text-5xl mb-2">🌴</div>
              <p className="font-semibold" style={{ color: '#2C2416' }}>Aucune activité planifiée</p>
              <p className="text-sm" style={{ color: '#8A7B6A' }}>Ajoute ta première activité</p>
              <button onClick={() => setShowModal(true)}
                className="mt-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/20"
                style={{ background: '#C2714A' }}
              >
                Ajouter une activité
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(grouped).map(([day, acts]) => (
                <div key={day}>
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest capitalize" style={{ color: '#B5A89A' }}>
                    {formatDate(acts[0].scheduled_at)}
                  </p>
                  <div className="flex flex-col gap-3">
                    {acts.map((act) => {
                      const cfg = TYPE_CONFIG[act.activity_type] ?? TYPE_CONFIG.other
                      return (
                        <div key={act.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 pt-3">
                            <span className="text-xs font-bold tabular-nums" style={{ color: '#B5A89A' }}>
                              {formatTime(act.scheduled_at)}
                            </span>
                            <div className="h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
                          </div>
                          <div className="flex-1 rounded-2xl p-4 shadow-sm" style={{ background: cfg.color }}>
                            <div className="flex items-start gap-3">
                              <span className="text-xl">{cfg.emoji}</span>
                              <div className="flex-1">
                                <p className="font-semibold" style={{ color: '#2C2416' }}>{act.title}</p>
                                {act.description && <p className="mt-0.5 text-sm" style={{ color: '#8A7B6A' }}>{act.description}</p>}
                                {act.location_name && <p className="mt-1.5 text-xs font-medium" style={{ color: '#B5A89A' }}>📍 {act.location_name}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && activeTrip && (
        <CreateActivityModal tripId={activeTrip.id} onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); fetchData() }} />
      )}
    </div>
  )
}
