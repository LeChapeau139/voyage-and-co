'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityType } from '@/lib/types'

interface Props { tripId: string; onClose: () => void; onCreated: () => void }

const TYPES: { value: ActivityType; emoji: string; label: string }[] = [
  { value: 'food', emoji: '🍽️', label: 'Repas' },
  { value: 'culture', emoji: '🏛️', label: 'Culture' },
  { value: 'transport', emoji: '🚌', label: 'Transport' },
  { value: 'hotel', emoji: '🏨', label: 'Séjour' },
  { value: 'nature', emoji: '🌿', label: 'Nature' },
  { value: 'other', emoji: '📌', label: 'Autre' },
]

export default function CreateActivityModal({ tripId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ActivityType>('other')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !time) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setLoading(false); return }
    const scheduled_at = new Date(`${date}T${time}:00`).toISOString()
    const { error } = await supabase.from('activities').insert({
      trip_id: tripId, user_id: user.id, title: title.trim(),
      activity_type: type, scheduled_at,
      description: description.trim() || null,
      location_name: locationName.trim() || null,
    })
    if (error) { setError(error.message); setLoading(false) } else onCreated()
  }

  const inputClass = "w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition placeholder:text-[#B5A89A]"

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl">
        <div className="mb-5 flex justify-center">
          <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#2C2416' }}>Nouvelle activité</h2>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ color: '#B5A89A' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                className="flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-semibold transition"
                style={{
                  background: type === t.value ? '#F5E8DF' : '#FAFAF7',
                  color: type === t.value ? '#C2714A' : '#8A7B6A',
                  border: `1.5px solid ${type === t.value ? '#C2714A' : '#E8DFD0'}`,
                }}
              >
                <span className="text-lg">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          <input type="text" placeholder="Titre de l'activité *" value={title} onChange={e => setTitle(e.target.value)} required
            className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Heure *</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
              />
            </div>
          </div>
          <input type="text" placeholder="Lieu (optionnel)" value={locationName} onChange={e => setLocationName(e.target.value)}
            className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />
          <textarea placeholder="Notes (optionnel)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className={`${inputClass} resize-none`} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />
          {error && <p className="text-sm" style={{ color: '#C2714A' }}>{error}</p>}
          <button type="submit" disabled={loading || !title.trim() || !date || !time}
            className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
          >
            {loading ? 'Ajout...' : 'Ajouter l\'activité'}
          </button>
        </form>
      </div>
    </div>
  )
}
