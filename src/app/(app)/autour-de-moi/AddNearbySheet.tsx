'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityType, Trip } from '@/lib/types'
import type { NearbyPlace } from './page'
import { useToast } from '@/contexts/ToastContext'
import FolderPickerSheet from '../activites/FolderPickerSheet'

interface Props {
  place: NearbyPlace
  activityType: ActivityType
  onClose: () => void
  onDone: () => void
}

type Screen = 'choice' | 'plan-schedule' | 'success'

const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  food: '🍽️', culture: '🏛️', transport: '🚌', hotel: '🏨', nature: '🌿', other: '📍',
}

export default function AddNearbySheet({ place, activityType, onClose, onDone }: Props) {
  const { toast } = useToast()
  const [screen, setScreen] = useState<Screen>('choice')
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [pendingFolderId, setPendingFolderId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('trips').select('*').eq('is_active', true).single()
      .then(({ data }) => setActiveTrip(data))
  }, [])

  const locationLabel = place.location.formatted_address ?? place.location.address ?? place.location.locality ?? null

  const addToLibrary = async (folderId: string | null) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    await supabase.from('places').insert({
      user_id: user.id,
      title: place.name,
      activity_type: activityType,
      location_name: locationLabel,
      description: null,
      is_favorite: false,
      photos: [],
      folder_id: folderId,
    })
    setLoading(false)
    toast.success('Ajouté à ta bibliothèque !')
    setSuccessMsg('Ajouté à ta bibliothèque !')
    setScreen('success')
    setTimeout(() => onDone(), 1400)
  }

  const addNow = async () => {
    if (!activeTrip) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    await supabase.from('activities').insert({
      user_id: user.id,
      trip_id: activeTrip.id,
      title: place.name,
      activity_type: activityType,
      entry_type: 'memory',
      location_name: locationLabel,
      description: null,
      scheduled_at: new Date().toISOString(),
      photos: [],
    })
    setLoading(false)
    toast.success(`Souvenir ajouté à "${activeTrip.name}" !`)
    setSuccessMsg(`Souvenir ajouté à "${activeTrip.name}" !`)
    setScreen('success')
    setTimeout(() => onDone(), 1400)
  }

  const addPlanned = async () => {
    if (!activeTrip || !date) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    await supabase.from('activities').insert({
      user_id: user.id,
      trip_id: activeTrip.id,
      title: place.name,
      activity_type: activityType,
      entry_type: 'planned',
      location_name: locationLabel,
      description: null,
      scheduled_at: `${date}T${time}:00`,
      photos: [],
    })
    setLoading(false)
    toast.success('Planifié dans ton voyage ! 📅')
    setSuccessMsg('Planifié dans ton voyage !')
    setScreen('success')
    setTimeout(() => onDone(), 1400)
  }

  const handle = (
    <div className="mb-4 flex justify-center">
      <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
    </div>
  )

  const PlacePreview = () => (
    <div className="mb-4 flex items-center gap-3 rounded-2xl p-3" style={{ background: '#F5E8DF' }}>
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: '#EDD9C8' }}
      >
        {ACTIVITY_EMOJI[activityType]}
      </div>
      <div className="min-w-0">
        <p className="font-semibold truncate text-sm" style={{ color: '#2C2416' }}>{place.name}</p>
        {locationLabel && <p className="text-xs truncate mt-0.5" style={{ color: '#8A7B6A' }}>📍 {locationLabel}</p>}
      </div>
    </div>
  )

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl">
        {handle}

        {screen === 'success' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-5xl">✅</div>
            <p className="text-base font-bold" style={{ color: '#2C2416' }}>{successMsg}</p>
          </div>
        )}

        {screen === 'choice' && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: '#2C2416' }}>Ajouter ce lieu</h2>
              <button onClick={onClose} style={{ color: '#B5A89A' }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PlacePreview />
            <div className="flex flex-col gap-2.5">
              {/* Add NOW to active trip */}
              <button onClick={addNow} disabled={!activeTrip || loading}
                className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#F5E8DF', border: '1.5px solid #D4B89A' }}
              >
                <span className="text-2xl">✈️</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>
                    {activeTrip ? `J'y suis maintenant` : 'Aucun voyage actif'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>
                    {activeTrip ? `Ajouter à "${activeTrip.name}"` : 'Active un voyage d\'abord'}
                  </p>
                </div>
              </button>

              {/* Plan for later */}
              <button onClick={() => activeTrip && setScreen('plan-schedule')} disabled={!activeTrip}
                className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#F7F2EA', border: '1.5px solid #E8DFD0' }}
              >
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Planifier pour plus tard</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>Choisir une date et une heure</p>
                </div>
              </button>

              {/* Library */}
              <button onClick={() => setShowFolderPicker(true)} disabled={loading}
                className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#F7F2EA', border: '1.5px solid #E8DFD0' }}
              >
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Ma bibliothèque</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>Sauvegarder dans un dossier</p>
                </div>
              </button>
            </div>
          </>
        )}

        {screen === 'plan-schedule' && activeTrip && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button onClick={() => setScreen('choice')} className="flex items-center gap-1 text-sm" style={{ color: '#8A7B6A' }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
            </div>
            <PlacePreview />
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
              <button onClick={addPlanned} disabled={!date || loading}
                className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
              >
                {loading ? 'Ajout...' : 'Planifier'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>

    {showFolderPicker && (
      <FolderPickerSheet
        onSelect={(folderId) => {
          setShowFolderPicker(false)
          addToLibrary(folderId)
        }}
        onClose={() => setShowFolderPicker(false)}
      />
    )}
  </>
  )
}
