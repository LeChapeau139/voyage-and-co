'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Place, ActivityType } from '@/lib/types'
import CreateActivityModal from '../../activites/CreateActivityModal'
import { useToast } from '@/contexts/ToastContext'

interface Props { tripId: string; onClose: () => void; onCreated: () => void }

type Screen = 'choice' | 'library' | 'manual' | 'schedule'

const TYPE_CONFIG: Record<ActivityType, { emoji: string; color: string }> = {
  food:      { emoji: '🍽️', color: '#FEF3C7' },
  culture:   { emoji: '🏛️', color: '#E8F0E9' },
  transport: { emoji: '🚌', color: '#E8EFF7' },
  hotel:     { emoji: '🏨', color: '#F3E8F5' },
  nature:    { emoji: '🌿', color: '#E8F0E9' },
  other:     { emoji: '📌', color: '#F7F2EA' },
}

export default function AddToTripModal({ tripId, onClose, onCreated }: Props) {
  const { toast } = useToast()
  const [screen, setScreen] = useState<Screen>('choice')
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [scheduling, setScheduling] = useState(false)

  useEffect(() => {
    supabase.from('places').select('*').eq('is_favorite', true).order('created_at', { ascending: false })
      .then(({ data }) => setPlaces(data ?? []))
  }, [])

  const schedulePlace = async () => {
    if (!selectedPlace || !date) return
    setScheduling(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setScheduling(false); return }

    await supabase.from('activities').insert({
      user_id: user.id,
      trip_id: tripId,
      title: selectedPlace.title,
      description: selectedPlace.description,
      activity_type: selectedPlace.activity_type,
      location_name: selectedPlace.location_name,
      scheduled_at: `${date}T${time}:00`,
    })
    toast.success('Activité ajoutée au planning 📅')
    onCreated()
  }

  if (screen === 'manual') {
    return <CreateActivityModal tripId={tripId} onClose={onClose} onCreated={onCreated} />
  }

  const sheetClass = "animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
  const handle = <div className="mb-5 flex justify-center"><div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} /></div>

  const backBtn = (to: Screen) => (
    <button onClick={() => setScreen(to)} className="flex items-center gap-1 text-sm" style={{ color: '#8A7B6A' }}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Retour
    </button>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      {screen === 'choice' && (
        <div className={sheetClass} onClick={e => e.stopPropagation()}>
          {handle}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: '#2C2416' }}>Ajouter une activité</h2>
            <button onClick={onClose} style={{ color: '#B5A89A' }}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => setScreen('library')}
              className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
              style={{ background: '#F5E8DF', border: '1.5px solid #E8DFD0' }}
            >
              <span className="text-3xl">⭐</span>
              <div>
                <p className="font-semibold" style={{ color: '#2C2416' }}>Depuis ma bibliothèque</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>Ajouter un lieu que tu as déjà sauvegardé</p>
              </div>
            </button>
            <button onClick={() => setScreen('manual')}
              className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
              style={{ background: '#F7F2EA', border: '1.5px solid #E8DFD0' }}
            >
              <span className="text-3xl">✏️</span>
              <div>
                <p className="font-semibold" style={{ color: '#2C2416' }}>Créer manuellement</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>Saisir une activité directement</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {screen === 'library' && (
        <div className={sheetClass} onClick={e => e.stopPropagation()}>
          {handle}
          <div className="mb-4 flex items-center gap-3">
            {backBtn('choice')}
            <h2 className="text-base font-bold" style={{ color: '#2C2416' }}>Mes favoris</h2>
          </div>
          {places.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-4xl mb-3">⭐</p>
              <p className="font-semibold" style={{ color: '#2C2416' }}>Aucun favori</p>
              <p className="text-sm mt-1" style={{ color: '#8A7B6A' }}>
                Mets des lieux en favori dans l'onglet Bibliothèque
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {places.map(place => {
                const cfg = TYPE_CONFIG[place.activity_type] ?? TYPE_CONFIG.other
                return (
                  <button key={place.id}
                    onClick={() => { setSelectedPlace(place); setScreen('schedule') }}
                    className="flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98]"
                    style={{ background: cfg.color }}
                  >
                    <span className="text-xl">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#2C2416' }}>{place.title}</p>
                      {place.location_name && (
                        <p className="text-xs truncate" style={{ color: '#8A7B6A' }}>📍 {place.location_name}</p>
                      )}
                    </div>
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#B5A89A' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {screen === 'schedule' && selectedPlace && (
        <div className={sheetClass} onClick={e => e.stopPropagation()}>
          {handle}
          <div className="mb-4 flex items-center gap-3">
            {backBtn('library')}
          </div>
          <div className="mb-5 rounded-2xl p-3 flex items-center gap-3"
            style={{ background: TYPE_CONFIG[selectedPlace.activity_type]?.color ?? '#F7F2EA' }}
          >
            <span className="text-2xl">{TYPE_CONFIG[selectedPlace.activity_type]?.emoji ?? '📌'}</span>
            <div>
              <p className="font-semibold" style={{ color: '#2C2416' }}>{selectedPlace.title}</p>
              {selectedPlace.location_name && <p className="text-xs" style={{ color: '#8A7B6A' }}>📍 {selectedPlace.location_name}</p>}
            </div>
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
            <button onClick={schedulePlace} disabled={!date || scheduling}
              className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
            >
              {scheduling ? 'Ajout...' : 'Ajouter au planning'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
