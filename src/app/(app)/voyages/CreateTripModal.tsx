'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { TravelStyle } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'
import { COUNTRIES } from '@/lib/countries'

interface Props { onClose: () => void; onCreated: () => void }

type Step = 'form' | 'generating'

const STYLES: { value: TravelStyle; label: string; emoji: string }[] = [
  { value: 'solo',    label: 'Solo',       emoji: '🧳' },
  { value: 'couple',  label: 'Couple',     emoji: '💑' },
  { value: 'friends', label: 'Amis',       emoji: '👥' },
  { value: 'family',  label: 'Famille',    emoji: '👨‍👩‍👧' },
]

export default function CreateTripModal({ onClose, onCreated }: Props) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [countryInput, setCountryInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('solo')
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCountryInput = (val: string) => {
    setCountryInput(val)
    setCountry('')
    if (val.length < 1) { setSuggestions([]); setShowSuggestions(false); return }
    const filtered = COUNTRIES.filter(c =>
      c.toLowerCase().startsWith(val.toLowerCase())
    ).slice(0, 6)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const selectCountry = (c: string) => {
    setCountry(c)
    setCountryInput(c)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setStep('generating')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setStep('form'); return }

    const destinationValue = city.trim()
      ? `${city.trim()}, ${country || countryInput}`
      : (country || countryInput || null)

    const { data: trip, error: insertError } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        name: name.trim(),
        destination: destinationValue || null,
        start_date: startDate || null,
        end_date: endDate || null,
        description: description.trim() || null,
        is_active: false,
        travel_style: travelStyle,
      })
      .select()
      .single()

    if (insertError || !trip) {
      setError(insertError?.message ?? 'Erreur')
      toast.error('Impossible de créer le voyage')
      setStep('form')
      return
    }

    if (destinationValue) {
      fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id, destination: destinationValue }),
      }).catch(() => {})
    }

    toast.success('Voyage créé ! 🎉')
    onCreated()
  }

  const inputClass = "w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition placeholder:text-[#B5A89A]"
  const inputStyle = { borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex justify-center">
          <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
        </div>

        {step === 'generating' ? (
          <div className="flex flex-col items-center gap-4 py-10">
            {/* Spinner */}
            <div
              className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: '#F5E8DF', borderTopColor: '#C2714A' }}
            />
            <p className="text-base font-semibold" style={{ color: '#2C2416' }}>
              Création du voyage...
            </p>
            <p className="text-center text-sm leading-relaxed" style={{ color: '#8A7B6A' }}>
              On génère l'illustration de{' '}
              <span className="font-semibold" style={{ color: '#C2714A' }}>
                {city ? `${city}, ${country || countryInput}` : (country || countryInput)}
              </span>
              {' '}en arrière-plan 🎨
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#2C2416' }}>Nouveau voyage ✈️</h2>
              <button onClick={onClose} className="rounded-full p-1.5 transition" style={{ color: '#B5A89A' }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text" placeholder="Nom du voyage *" value={name}
                onChange={e => setName(e.target.value)} required
                className={inputClass} style={inputStyle}
              />
              <input
                type="text" placeholder="Ville / Lieu (ex: Tokyo, Athènes…)" value={city}
                onChange={e => setCity(e.target.value)}
                className={inputClass} style={inputStyle}
              />

              {/* Country autocomplete */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pays *"
                  value={countryInput}
                  onChange={e => handleCountryInput(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  onBlur={() => { blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150) }}
                  autoComplete="off"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: country ? '#C2714A' : inputStyle.borderColor,
                  }}
                />
                {country && (
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#C2714A' }}>✓</span>
                )}
                {showSuggestions && (
                  <ul
                    className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-2xl shadow-lg"
                    style={{ background: '#FFFFFF', border: '1px solid #E8DFD0' }}
                  >
                    {suggestions.map(s => (
                      <li key={s}>
                        <button
                          type="button"
                          onMouseDown={() => { if (blurTimeout.current) clearTimeout(blurTimeout.current); selectCountry(s) }}
                          className="w-full px-4 py-2.5 text-left text-sm transition"
                          style={{ color: '#2C2416' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F7F2EA')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Travel style */}
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map(s => (
                  <button key={s.value} type="button" onClick={() => setTravelStyle(s.value)}
                    className="flex flex-col items-center gap-1 rounded-2xl py-2.5 text-xs font-semibold transition active:scale-95"
                    style={{
                      background: travelStyle === s.value ? '#F5E8DF' : '#FAFAF7',
                      border: `1.5px solid ${travelStyle === s.value ? '#C2714A' : '#E8DFD0'}`,
                      color: travelStyle === s.value ? '#C2714A' : '#8A7B6A',
                    }}
                  >
                    <span className="text-base">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Début</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className={inputClass} style={inputStyle}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Fin</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className={inputClass} style={inputStyle}
                  />
                </div>
              </div>
              <textarea
                placeholder="Description (optionnel)" value={description}
                onChange={e => setDescription(e.target.value)} rows={2}
                className={`${inputClass} resize-none`} style={inputStyle}
              />
              {error && <p className="text-sm" style={{ color: '#C2714A' }}>{error}</p>}
              <button
                type="submit" disabled={!name.trim()}
                className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
                style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
              >
                Créer le voyage
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
