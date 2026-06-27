'use client'

import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import type { ActivityType } from '@/lib/types'

interface ImportedPhoto {
  id: string
  file: File
  preview: string
  date: string
  time: string
  locationName: string
  locationPending: boolean
  type: ActivityType
  typePending: boolean
  assigned: boolean
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
  'royaume-uni': 'GBP', 'united kingdom': 'GBP',
  'suisse': 'CHF', 'thaïlande': 'THB', 'thailand': 'THB',
  'maroc': 'MAD', 'turquie': 'TRY', 'mexique': 'MXN',
  'australie': 'AUD', 'australia': 'AUD', 'canada': 'CAD',
  'chine': 'CNY', 'china': 'CNY', 'corée': 'KRW',
  'inde': 'INR', 'india': 'INR', 'brésil': 'BRL', 'brazil': 'BRL',
  'indonésie': 'IDR', 'vietnam': 'VND', 'singapour': 'SGD',
}

function detectCurrencyCode(loc: string, dest?: string | null) {
  const lower = (loc + ' ' + (dest ?? '')).toLowerCase()
  const match = Object.entries(COUNTRY_CURRENCY).find(([k]) => lower.includes(k))
  return match ? match[1] : 'EUR'
}

function todayStr() { return new Date().toISOString().split('T')[0] }
function nowTimeStr() { return new Date().toTimeString().slice(0, 5) }

export default function BulkImportFlow({ tripId, tripDestination, onClose, onDone }: Props) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const previewsRef = useRef<string[]>([])

  const [phase, setPhase] = useState<'select' | 'organize' | 'form'>('select')
  const [photos, setPhotos] = useState<ImportedPhoto[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [memoriesCreated, setMemoriesCreated] = useState(0)

  // Form state
  const [title, setTitle] = useState('')
  const [memType, setMemType] = useState<ActivityType>('other')
  const [shakingTitle, setShakingTitle] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)

  useEffect(() => { fileRef.current?.click() }, [])
  useEffect(() => { return () => { previewsRef.current.forEach(u => URL.revokeObjectURL(u)) } }, [])
  useEffect(() => {
    if (phase === 'form') setTimeout(() => titleRef.current?.focus(), 150)
  }, [phase])

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) { onClose(); return }

    const gpsMap: Record<number, { latitude: number; longitude: number } | null> = {}

    const initial: ImportedPhoto[] = await Promise.all(
      files.map(async (file, i) => {
        let date = todayStr(), time = nowTimeStr()
        try {
          const dateExif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'DateTime', 'CreateDate'] }).catch(() => null)
          const gps = await exifr.gps(file).catch(() => null)
          gpsMap[i] = gps ?? null
          const rawDate = dateExif?.DateTimeOriginal ?? dateExif?.DateTime ?? dateExif?.CreateDate
          if (rawDate) {
            const d = rawDate instanceof Date ? rawDate : new Date(rawDate)
            if (!isNaN(d.getTime())) { date = d.toISOString().split('T')[0]; time = d.toTimeString().slice(0, 5) }
          }
        } catch { gpsMap[i] = null }

        return {
          id: `${i}-${file.name}`,
          file, preview: URL.createObjectURL(file),
          date, time, locationName: '',
          locationPending: !!gpsMap[i],
          type: 'other' as ActivityType, typePending: true, assigned: false,
        }
      })
    )

    previewsRef.current = initial.map(d => d.preview)
    setPhotos(initial)
    setPhase('organize')

    // Background: Gemini classify
    files.forEach((file, i) => {
      const fd = new FormData(); fd.append('file', file)
      fetch('/api/classify-activity', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, type: data.type ?? 'other', typePending: false } : p)))
        .catch(() => setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, typePending: false } : p)))
    })

    // Background: geocode (sequential)
    ;(async () => {
      for (let i = 0; i < files.length; i++) {
        const gps = gpsMap[i]
        if (!gps) { setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, locationPending: false } : p)); continue }
        try {
          if (i > 0) await new Promise(r => setTimeout(r, 1100))
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${gps.latitude}&lon=${gps.longitude}&format=json&accept-language=fr`)
          const geo = await res.json()
          const addr = geo.address ?? {}
          const place = addr.amenity || addr.tourism || addr.historic || addr.leisure || null
          const road = addr.road || addr.pedestrian || null
          const neighbourhood = addr.neighbourhood || addr.suburb || null
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.county
          const country = addr.country
          const locationName = [place || road, neighbourhood !== city ? neighbourhood : null, city, country]
            .filter((v): v is string => Boolean(v)).filter((v, j, a) => a.indexOf(v) === j).join(', ')
          setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, locationName, locationPending: false } : p))
        } catch {
          setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, locationPending: false } : p))
        }
      }
    })()
  }

  const togglePhoto = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const goToForm = () => {
    if (selected.size === 0) return
    // Pre-fill type from first selected photo
    const firstId = [...selected][0]
    const first = photos.find(p => p.id === firstId)
    if (first && !first.typePending) setMemType(first.type)
    setTitle('')
    setPhase('form')
  }

  const shakeTitle = () => {
    setShakingTitle(true)
    setTimeout(() => setShakingTitle(false), 450)
    titleRef.current?.focus()
  }

  const createMemory = async () => {
    if (!title.trim()) { shakeTitle(); return }
    const selectedPhotos = photos.filter(p => selected.has(p.id))
    if (!selectedPhotos.length) return

    setSavingMemory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingMemory(false); return }

    const uploadedUrls: string[] = []
    for (const photo of selectedPhotos) {
      try {
        const fd = new FormData(); fd.append('file', photo.file)
        const res = await fetch('/api/upload-activity-photo', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.url) uploadedUrls.push(data.url)
      } catch {}
    }

    const first = selectedPhotos[0]
    const locationName = selectedPhotos.find(p => p.locationName)?.locationName ?? ''

    await supabase.from('activities').insert({
      trip_id: tripId, user_id: user.id,
      title: title.trim(), activity_type: memType, entry_type: 'memory',
      scheduled_at: `${first.date}T${first.time}:00`,
      location_name: locationName || null,
      photos: uploadedUrls,
      cost_currency: detectCurrencyCode(locationName, tripDestination),
      is_expandable: false, photo_details: [],
    })

    const assignedIds = new Set(selected)
    setPhotos(prev => prev.map(p => assignedIds.has(p.id) ? { ...p, assigned: true } : p))
    setSelected(new Set())
    setTitle('')
    setMemType('other')
    setMemoriesCreated(c => c + 1)
    setSavingMemory(false)
    setPhase('organize')
  }

  const finish = () => {
    if (memoriesCreated > 0) {
      toast.success(`${memoriesCreated} souvenir${memoriesCreated > 1 ? 's' : ''} créé${memoriesCreated > 1 ? 's' : ''} ! 📸`)
      onDone()
    } else {
      onClose()
    }
  }

  // ── Select phase ──
  if (phase === 'select') {
    return <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />
  }

  const unassigned = photos.filter(p => !p.assigned)
  const allDone = unassigned.length === 0

  // ── Form phase ──
  if (phase === 'form') {
    const selectedPhotos = photos.filter(p => selected.has(p.id))
    const first = selectedPhotos[0]
    return (
      <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#FAF8F5' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pb-3 pt-14">
          <button
            onClick={() => setPhase('organize')}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: '#F0E8DC', color: '#2C2416' }}
          >←</button>
          <div>
            <p className="text-sm font-bold" style={{ color: '#2C2416' }}>Nouveau souvenir</p>
            <p className="text-xs" style={{ color: '#8A7B6A' }}>{selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Selected photos preview row */}
        <div className="flex gap-2 overflow-x-auto px-5 pb-4">
          {selectedPhotos.map(p => (
            <img key={p.id} src={p.preview} alt="" className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10">
          {/* Type selector */}
          <div className="mb-4 flex items-center gap-2">
            {TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setMemType(t.value)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl transition active:scale-90"
                style={{ background: memType === t.value ? '#C2714A' : '#F5EDE4' }}
                title={t.label}
              >{t.emoji}</button>
            ))}
          </div>

          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            placeholder="Titre du souvenir *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createMemory()}
            className={`w-full rounded-2xl border px-4 py-3.5 text-sm outline-none placeholder:text-[#B5A89A] ${shakingTitle ? 'animate-[shake_0.45s_ease]' : ''}`}
            style={{ borderColor: shakingTitle ? '#C2714A' : '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />

          {/* Badges */}
          {first && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1.5 text-[11px]" style={{ background: '#F5EDE4', color: '#8A7B6A' }}>
                📅 {new Date(first.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {first.locationPending ? (
                <span className="rounded-full px-3 py-1.5 text-[11px]" style={{ background: '#F5EDE4', color: '#B5A89A' }}>🔍 Lieu en cours…</span>
              ) : first.locationName ? (
                <span className="rounded-full px-3 py-1.5 text-[11px]" style={{ background: '#F5EDE4', color: '#8A7B6A' }}>📍 {first.locationName}</span>
              ) : null}
            </div>
          )}

          <button
            onClick={createMemory}
            disabled={savingMemory}
            className="mt-6 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: '#C2714A' }}
          >
            {savingMemory ? 'Création en cours…' : '✓ Créer ce souvenir'}
          </button>
        </div>
      </div>
    )
  }

  // ── Organize phase ──
  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-14">
        <button onClick={finish}
          className="rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: '#F0E8DC', color: '#8A7B6A' }}
        >✕ Quitter</button>

        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: '#2C2416' }}>
            {allDone ? '🎉 Terminé !' : `${unassigned.length} photo${unassigned.length > 1 ? 's' : ''} à organiser`}
          </p>
          {memoriesCreated > 0 && (
            <p className="text-[10px]" style={{ color: '#C2714A' }}>
              {memoriesCreated} souvenir{memoriesCreated > 1 ? 's' : ''} créé{memoriesCreated > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div style={{ width: 64 }} />
      </div>

      {allDone ? (
        /* All assigned */
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
          <div className="text-6xl">🎉</div>
          <p className="text-lg font-bold" style={{ color: '#2C2416' }}>Toutes les photos sont organisées !</p>
          <p className="text-sm" style={{ color: '#8A7B6A' }}>{memoriesCreated} souvenir{memoriesCreated > 1 ? 's' : ''} créé{memoriesCreated > 1 ? 's' : ''}</p>
          <button onClick={finish}
            className="mt-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white"
            style={{ background: '#C2714A' }}
          >Voir le voyage →</button>
        </div>
      ) : (
        <>
          {/* Instruction */}
          <p className="px-5 pb-3 text-xs leading-relaxed" style={{ color: '#8A7B6A' }}>
            Coche les photos qui vont ensemble, puis crée un souvenir.
          </p>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-32">
            <div className="grid grid-cols-3 gap-1.5">
              {unassigned.map(photo => {
                const isSel = selected.has(photo.id)
                const selIdx = [...selected].indexOf(photo.id)
                return (
                  <button
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    className="relative aspect-square overflow-hidden rounded-xl transition active:scale-95"
                  >
                    <img src={photo.preview} alt="" className="h-full w-full object-cover" />

                    {/* Dimming when not selected but others are */}
                    {!isSel && selected.size > 0 && (
                      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
                    )}

                    {/* Checkbox (always visible) */}
                    <div
                      className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition"
                      style={{
                        background: isSel ? '#C2714A' : 'rgba(255,255,255,0.7)',
                        borderColor: isSel ? '#C2714A' : 'rgba(255,255,255,0.9)',
                      }}
                    >
                      {isSel && (
                        <span className="text-[11px] font-bold text-white">{selIdx + 1}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom bar — always visible */}
          <div className="absolute bottom-0 left-0 right-0 border-t bg-white px-5 pb-10 pt-4"
            style={{ borderColor: '#E8DFD0' }}
          >
            {selected.size === 0 ? (
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="text-sm" style={{ color: '#B5A89A' }}>
                  ☝️ Sélectionne les photos d'un même souvenir
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#2C2416' }}>
                    {selected.size} photo{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
                  </p>
                  <button onClick={() => setSelected(new Set())}
                    className="text-xs" style={{ color: '#B5A89A' }}>Désélectionner</button>
                </div>
                <button
                  onClick={goToForm}
                  className="rounded-2xl px-5 py-3 text-sm font-bold text-white transition active:scale-95"
                  style={{ background: '#C2714A' }}
                >
                  Créer →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
