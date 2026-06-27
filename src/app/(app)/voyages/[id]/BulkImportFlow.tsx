'use client'

import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import type { ActivityType } from '@/lib/types'

interface DraftPhoto {
  file: File
  preview: string
  title: string
  type: ActivityType
  date: string
  time: string
  locationName: string
  locationPending: boolean
  typePending: boolean
  isExpandable: boolean
  skipped: boolean
}

interface Props {
  tripId: string
  tripDestination?: string | null
  onClose: () => void
  onDone: () => void
}

const TYPES: { value: ActivityType; emoji: string; label: string }[] = [
  { value: 'food',      emoji: '🍽️', label: 'Repas' },
  { value: 'culture',   emoji: '🏛️', label: 'Culture' },
  { value: 'nature',    emoji: '🌿', label: 'Nature' },
  { value: 'hotel',     emoji: '🏨', label: 'Séjour' },
  { value: 'transport', emoji: '🚌', label: 'Transport' },
  { value: 'other',     emoji: '📍', label: 'Autre' },
]

const COUNTRY_CURRENCY: Record<string, string> = {
  'japon': 'JPY', 'japan': 'JPY',
  'états-unis': 'USD', 'united states': 'USD', 'usa': 'USD',
  'royaume-uni': 'GBP', 'united kingdom': 'GBP', 'angleterre': 'GBP',
  'suisse': 'CHF', 'switzerland': 'CHF',
  'thaïlande': 'THB', 'thailand': 'THB',
  'maroc': 'MAD', 'morocco': 'MAD',
  'turquie': 'TRY', 'turkey': 'TRY',
  'mexique': 'MXN', 'mexico': 'MXN',
  'australie': 'AUD', 'australia': 'AUD',
  'canada': 'CAD',
  'chine': 'CNY', 'china': 'CNY',
  'corée': 'KRW', 'korea': 'KRW',
  'inde': 'INR', 'india': 'INR',
  'brésil': 'BRL', 'brazil': 'BRL',
  'indonésie': 'IDR', 'indonesia': 'IDR',
  'vietnam': 'VND',
  'singapour': 'SGD', 'singapore': 'SGD',
  'norvège': 'NOK', 'suède': 'SEK', 'danemark': 'DKK',
  'pologne': 'PLN',
  'égypte': 'EGP', 'egypt': 'EGP',
}

function detectCurrencyCode(locationName: string, tripDestination?: string | null): string {
  const lower = (locationName + ' ' + (tripDestination ?? '')).toLowerCase()
  const match = Object.entries(COUNTRY_CURRENCY).find(([key]) => lower.includes(key))
  return match ? match[1] : 'EUR'
}

function todayStr() { return new Date().toISOString().split('T')[0] }
function nowTimeStr() { return new Date().toTimeString().slice(0, 5) }

export default function BulkImportFlow({ tripId, tripDestination, onClose, onDone }: Props) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const previewsRef = useRef<string[]>([])

  const [phase, setPhase] = useState<'select' | 'fill' | 'saving'>('select')
  const [drafts, setDrafts] = useState<DraftPhoto[]>([])
  const [current, setCurrent] = useState(0)
  const [shakingTitle, setShakingTitle] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [totalToSave, setTotalToSave] = useState(0)

  useEffect(() => {
    fileRef.current?.click()
  }, [])

  useEffect(() => {
    return () => { previewsRef.current.forEach(url => URL.revokeObjectURL(url)) }
  }, [])

  useEffect(() => {
    if (phase === 'fill') setTimeout(() => titleRef.current?.focus(), 150)
  }, [phase, current])

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) { onClose(); return }

    const gpsMap: Record<number, { latitude: number; longitude: number } | null> = {}

    const initial: DraftPhoto[] = await Promise.all(
      files.map(async (file, i) => {
        let date = todayStr()
        let time = nowTimeStr()

        try {
          const dateExif = await exifr.parse(file, {
            pick: ['DateTimeOriginal', 'DateTime', 'CreateDate'],
          }).catch(() => null)
          const gps = await exifr.gps(file).catch(() => null)
          gpsMap[i] = gps ?? null

          const rawDate = dateExif?.DateTimeOriginal ?? dateExif?.DateTime ?? dateExif?.CreateDate
          if (rawDate) {
            const d = rawDate instanceof Date ? rawDate : new Date(rawDate)
            if (!isNaN(d.getTime())) {
              date = d.toISOString().split('T')[0]
              time = d.toTimeString().slice(0, 5)
            }
          }
        } catch { gpsMap[i] = null }

        return {
          file,
          preview: URL.createObjectURL(file),
          title: '',
          type: 'other' as ActivityType,
          date,
          time,
          locationName: '',
          locationPending: !!gpsMap[i],
          typePending: true,
          isExpandable: false,
          skipped: false,
        }
      })
    )

    previewsRef.current = initial.map(d => d.preview)
    setDrafts(initial)
    setPhase('fill')
    setCurrent(0)

    // Background: Gemini classify (parallel)
    files.forEach((file, i) => {
      const fd = new FormData()
      fd.append('file', file)
      fetch('/api/classify-activity', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => setDrafts(prev => prev.map((d, idx) =>
          idx === i ? { ...d, type: data.type ?? 'other', typePending: false } : d
        )))
        .catch(() => setDrafts(prev => prev.map((d, idx) =>
          idx === i ? { ...d, typePending: false } : d
        )))
    })

    // Background: geocode (sequential, Nominatim 1 req/s)
    ;(async () => {
      for (let i = 0; i < files.length; i++) {
        const gps = gpsMap[i]
        if (!gps) {
          setDrafts(prev => prev.map((d, idx) => idx === i ? { ...d, locationPending: false } : d))
          continue
        }
        try {
          if (i > 0) await new Promise(r => setTimeout(r, 1100))
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${gps.latitude}&lon=${gps.longitude}&format=json&accept-language=fr`
          )
          const geo = await res.json()
          const addr = geo.address ?? {}
          const place = addr.amenity || addr.tourism || addr.historic || addr.leisure || null
          const road = addr.road || addr.pedestrian || addr.footway || null
          const neighbourhood = addr.neighbourhood || addr.suburb || null
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.county
          const country = addr.country
          const locationName = [place || road, neighbourhood !== city ? neighbourhood : null, city, country]
            .filter((v): v is string => Boolean(v))
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(', ')
          setDrafts(prev => prev.map((d, idx) =>
            idx === i ? { ...d, locationName, locationPending: false } : d
          ))
        } catch {
          setDrafts(prev => prev.map((d, idx) => idx === i ? { ...d, locationPending: false } : d))
        }
      }
    })()
  }

  const updateCurrent = (update: Partial<DraftPhoto>) => {
    setDrafts(prev => prev.map((d, i) => i === current ? { ...d, ...update } : d))
  }

  const shakeTitle = () => {
    setShakingTitle(true)
    setTimeout(() => setShakingTitle(false), 450)
    titleRef.current?.focus()
  }

  const triggerSave = async (skipCurrentIndex?: number) => {
    const toSave = drafts.filter((d, i) => {
      if (i === skipCurrentIndex) return false
      return !d.skipped && d.title.trim()
    })

    if (!toSave.length) { onClose(); return }

    setPhase('saving')
    setTotalToSave(toSave.length)
    setSavedCount(0)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { onClose(); return }

    let count = 0
    for (const draft of toSave) {
      let photoUrl = ''
      try {
        const ext = draft.file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `activity-photos/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data, error } = await supabase.storage.from('activity-photos').upload(path, draft.file)
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from('activity-photos').getPublicUrl(data.path)
          photoUrl = publicUrl
        }
      } catch {}

      await supabase.from('activities').insert({
        trip_id: tripId,
        user_id: user.id,
        title: draft.title.trim(),
        activity_type: draft.type,
        entry_type: 'memory',
        scheduled_at: `${draft.date}T${draft.time}:00`,
        location_name: draft.locationName || null,
        photos: photoUrl ? [photoUrl] : [],
        cost_currency: detectCurrencyCode(draft.locationName, tripDestination),
        is_expandable: draft.isExpandable,
        photo_details: [],
      })

      count++
      setSavedCount(count)
    }

    toast.success(`${count} souvenir${count > 1 ? 's' : ''} créé${count > 1 ? 's' : ''} ! 📸`)
    onDone()
  }

  const handleNext = () => {
    const draft = drafts[current]
    if (!draft.title.trim()) { shakeTitle(); return }
    if (current >= drafts.length - 1) triggerSave()
    else setCurrent(c => c + 1)
  }

  const handleSkip = () => {
    if (current >= drafts.length - 1) {
      triggerSave(current)
    } else {
      updateCurrent({ skipped: true })
      setCurrent(c => c + 1)
    }
  }

  // ─── Select phase: just the hidden input ───
  if (phase === 'select') {
    return (
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFiles}
        className="hidden"
      />
    )
  }

  // ─── Saving phase ───
  if (phase === 'saving') {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center" style={{ background: '#FAF8F5' }}>
        <div className="mb-4 text-5xl">📸</div>
        <p className="mb-1 text-base font-semibold" style={{ color: '#2C2416' }}>Création en cours…</p>
        <p className="text-sm" style={{ color: '#8A7B6A' }}>{savedCount} / {totalToSave} souvenirs</p>
        <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full" style={{ background: '#E8DFD0' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: totalToSave > 0 ? `${(savedCount / totalToSave) * 100}%` : '0%',
              background: '#C2714A',
            }}
          />
        </div>
      </div>
    )
  }

  // ─── Fill phase ───
  const draft = drafts[current]
  if (!draft) return null
  const isLast = current >= drafts.length - 1

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      {/* Header overlay */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 pt-14 pb-3">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        >✕</button>

        <span
          className="rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        >
          {current + 1} / {drafts.length}
        </span>

        <button
          onClick={handleSkip}
          className="rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.8)' }}
        >Ignorer</button>
      </div>

      {/* Photo */}
      <div className="flex-1 overflow-hidden">
        <img src={draft.preview} alt="" className="h-full w-full object-cover" />
      </div>

      {/* Bottom panel */}
      <div className="rounded-t-[2rem] bg-white px-5 pb-10 pt-5 shadow-2xl">
        {/* Type selector */}
        <div className="mb-3 flex items-center gap-2">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => updateCurrent({ type: t.value })}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition active:scale-90"
              style={{
                background: draft.type === t.value ? '#C2714A' : '#F5EDE4',
                opacity: draft.typePending && draft.type !== t.value ? 0.55 : 1,
              }}
              title={t.label}
            >{t.emoji}</button>
          ))}
          {draft.typePending && (
            <span className="text-[10px]" style={{ color: '#B5A89A' }}>détection…</span>
          )}
        </div>

        {/* Title input */}
        <input
          ref={titleRef}
          type="text"
          placeholder="Titre du souvenir *"
          value={draft.title}
          onChange={e => updateCurrent({ title: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleNext()}
          className={`w-full rounded-2xl border px-4 py-3.5 text-sm outline-none placeholder:text-[#B5A89A] ${shakingTitle ? 'animate-[shake_0.45s_ease]' : ''}`}
          style={{
            borderColor: shakingTitle ? '#C2714A' : '#E8DFD0',
            color: '#2C2416',
            background: '#FAFAF7',
          }}
        />

        {/* Date + location badges */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: '#F5EDE4', color: '#8A7B6A' }}>
            📅 {new Date(draft.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {draft.locationPending ? (
            <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: '#F5EDE4', color: '#B5A89A' }}>
              🔍 Lieu en cours…
            </span>
          ) : draft.locationName ? (
            <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: '#F5EDE4', color: '#8A7B6A' }}>
              📍 {draft.locationName}
            </span>
          ) : null}
        </div>

        {/* Toggle page détaillée */}
        <div
          className="mt-3 flex items-center justify-between rounded-2xl px-4 py-2.5"
          style={{
            background: draft.isExpandable ? '#FEF6F2' : '#FAFAF7',
            border: `1.5px solid ${draft.isExpandable ? '#C2714A' : '#E8DFD0'}`,
          }}
        >
          <p className="text-xs font-semibold" style={{ color: '#2C2416' }}>Page détaillée 📖</p>
          <button
            type="button"
            onClick={() => updateCurrent({ isExpandable: !draft.isExpandable })}
            className="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200"
            style={{ background: draft.isExpandable ? '#C2714A' : '#D4C9B8' }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: draft.isExpandable ? 'calc(100% - 1.125rem)' : '0.125rem' }}
            />
          </button>
        </div>

        {/* Next / Done button */}
        <button
          type="button"
          onClick={handleNext}
          className="mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98]"
          style={{ background: '#C2714A' }}
        >
          {isLast ? 'Terminer ✓' : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}
