'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateTripModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setLoading(false); return }

    const { error } = await supabase.from('trips').insert({
      user_id: user.id,
      name: name.trim(),
      destination: destination.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      description: description.trim() || null,
      is_active: false,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onCreated()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-white px-5 pb-10 pt-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="mx-auto h-1 w-10 rounded-full bg-zinc-200" />
        </div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Nouveau voyage</h2>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:text-zinc-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nom du voyage *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            type="text"
            placeholder="Destination (ex: Athènes, Grèce)"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-zinc-400">Début</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-zinc-400">Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <textarea
            placeholder="Description (optionnel)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="mt-1 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Création...' : 'Créer le voyage'}
          </button>
        </form>
      </div>
    </div>
  )
}
