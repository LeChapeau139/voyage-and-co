'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props { onClose: () => void; onCreated: () => void }

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setLoading(false); return }
    const { error } = await supabase.from('trips').insert({
      user_id: user.id, name: name.trim(),
      destination: destination.trim() || null,
      start_date: startDate || null, end_date: endDate || null,
      description: description.trim() || null, is_active: false,
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
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#2C2416' }}>Nouveau voyage ✈️</h2>
          <button onClick={onClose} className="rounded-full p-1.5 transition" style={{ color: '#B5A89A' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="text" placeholder="Nom du voyage *" value={name} onChange={e => setName(e.target.value)} required
            className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />
          <input type="text" placeholder="Destination (ex: Athènes, Grèce)" value={destination} onChange={e => setDestination(e.target.value)}
            className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Début</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
              />
            </div>
          </div>
          <textarea placeholder="Description (optionnel)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className={`${inputClass} resize-none`} style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />
          {error && <p className="text-sm" style={{ color: '#C2714A' }}>{error}</p>}
          <button type="submit" disabled={loading || !name.trim()}
            className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
            style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
          >
            {loading ? 'Création...' : 'Créer le voyage'}
          </button>
        </form>
      </div>
    </div>
  )
}
