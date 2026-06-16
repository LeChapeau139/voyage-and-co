'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityType } from '@/lib/types'

interface Props {
  tripId: string
  onClose: () => void
  onCreated: () => void
}

const TYPES: { value: ActivityType; emoji: string; label: string }[] = [
  { value: 'food',      emoji: '🍽️', label: 'Repas' },
  { value: 'culture',   emoji: '🏛️', label: 'Culture' },
  { value: 'transport', emoji: '🚌', label: 'Transport' },
  { value: 'hotel',     emoji: '🏨', label: 'Hébergement' },
  { value: 'nature',    emoji: '🌿', label: 'Nature' },
  { value: 'other',     emoji: '📌', label: 'Autre' },
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
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setLoading(false); return }

    const scheduled_at = new Date(`${date}T${time}:00`).toISOString()

    const { error } = await supabase.from('activities').insert({
      trip_id: tripId,
      user_id: user.id,
      title: title.trim(),
      activity_type: type,
      scheduled_at,
      description: description.trim() || null,
      location_name: locationName.trim() || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onCreated()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-white px-5 pb-10 pt-4 shadow-xl">
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Nouvelle activité</h2>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:text-zinc-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Type selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  type === t.value
                    ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Titre de l'activité *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-zinc-400">Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-zinc-400">Heure *</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Lieu (optionnel)"
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <textarea
            placeholder="Notes (optionnel)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !title.trim() || !date || !time}
            className="mt-1 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Ajout...' : 'Ajouter l\'activité'}
          </button>
        </form>
      </div>
    </div>
  )
}
