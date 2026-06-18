'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Place, Trip, ActivityType } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'

interface Props {
  place: Place
  onClose: () => void
  onDone: () => void
}

const TYPE_CONFIG: Record<ActivityType, { emoji: string; color: string }> = {
  food:      { emoji: '🍽️', color: '#FEF3C7' },
  culture:   { emoji: '🏛️', color: '#E8F0E9' },
  transport: { emoji: '🚌', color: '#E8EFF7' },
  hotel:     { emoji: '🏨', color: '#F3E8F5' },
  nature:    { emoji: '🌿', color: '#E8F0E9' },
  other:     { emoji: '📌', color: '#F7F2EA' },
}

type Screen = 'trips' | 'schedule'

export default function AddPlaceToTripSheet({ place, onClose, onDone }: Props) {
  const { toast } = useToast()
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [screen, setScreen] = useState<Screen>('trips')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('trips')
      .select('*')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => setTrips(data ?? []))
  }, [])

  const handleAddToTrip = async () => {
    if (!selectedTrip || !date) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase.from('activities').insert({
      user_id: user.id,
      trip_id: selectedTrip.id,
      title: place.title,
      description: place.description,
      activity_type: place.activity_type,
      location_name: place.location_name,
      entry_type: 'planned',
      scheduled_at: `${date}T${time}:00`,
    })

    toast.success(`Ajouté à "${selectedTrip.name}" 📅`)
    onDone()
  }

  const cfg = TYPE_CONFIG[place.activity_type] ?? TYPE_CONFIG.other
  const sheetClass = "animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
  const handle = <div className="mb-5 flex justify-center"><div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} /></div>

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className={sheetClass} onClick={e => e.stopPropagation()}>
        {handle}

        {/* Place card recap */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl p-3" style={{ background: cfg.color }}>
          <span className="text-2xl">{cfg.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold" style={{ color: '#2C2416' }}>{place.title}</p>
            {place.location_name && (
              <p className="truncate text-xs" style={{ color: '#8A7B6A' }}>📍 {place.location_name}</p>
            )}
          </div>
        </div>

        {screen === 'trips' && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: '#2C2416' }}>Ajouter à quel voyage ?</h2>
              <button onClick={onClose} style={{ color: '#B5A89A' }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {trips.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-4xl mb-3">✈️</p>
                <p className="font-semibold" style={{ color: '#2C2416' }}>Aucun voyage</p>
                <p className="text-sm mt-1" style={{ color: '#8A7B6A' }}>Crée d'abord un voyage dans l'onglet Voyages</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {trips.map(trip => (
                  <button key={trip.id}
                    onClick={() => { setSelectedTrip(trip); setScreen('schedule') }}
                    className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.98]"
                    style={{ background: trip.is_active ? '#F5E8DF' : '#F7F2EA', border: `1.5px solid ${trip.is_active ? '#C2714A' : '#E8DFD0'}` }}
                  >
                    <span className="text-xl">{trip.is_active ? '✈️' : '🗺️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-sm" style={{ color: '#2C2416' }}>{trip.name}</p>
                      {trip.destination && (
                        <p className="truncate text-xs" style={{ color: '#8A7B6A' }}>📍 {trip.destination}</p>
                      )}
                    </div>
                    {trip.is_active && (
                      <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: '#C2714A' }}>
                        En cours
                      </span>
                    )}
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#B5A89A' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {screen === 'schedule' && selectedTrip && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button onClick={() => setScreen('trips')} className="flex items-center gap-1 text-sm" style={{ color: '#8A7B6A' }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <p className="text-sm font-semibold truncate" style={{ color: '#2C2416' }}>{selectedTrip.name}</p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none"
                  style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Heure</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none"
                  style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
                />
              </div>
              <button onClick={handleAddToTrip} disabled={!date || saving}
                className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
              >
                {saving ? 'Ajout...' : 'Ajouter au planning 📅'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
