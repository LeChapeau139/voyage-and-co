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
  'suisse': 'CHF', 'switzerland': 'CHF',
  'thaïlande': 'THB', 'thailand': 'THB',
  'maroc': 'MAD', 'turquie': 'TRY',
  'mexique': 'MXN', 'australie': 'AUD', 'australia': 'AUD',
  'canada': 'CAD', 'chine': 'CNY', 'china': 'CNY',
  'corée': 'KRW', 'inde': 'INR', 'india': 'INR',
  'brésil': 'BRL', 'brazil': 'BRL',
  'indonésie': 'IDR', 'vietnam': 'VND',
  'singapour': 'SGD', 'singapore': 'SGD',
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

  const [phase, setPhase] = useState<'select' | 'organize' | 'saving'>('select')
  const [photos, setPhotos] = useState<ImportedPhoto[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [memoriesCreated, setMemoriesCreated] = useState(0)

  // Current memory form
  const [title, setTitle] = useState('')
  const [memType, setMemType] = useState<ActivityType>('other')
  const [shakingTitle, setShakingTitle] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)

  useEffect(() => {
    fileRef.current?.click()
  }, [])

  useEffect(() => {
    return () => { previewsRef.current.forEach(url => URL.revokeObjectURL(url)) }
  }, [])

  // Focus title when photos are selected
  useEffect(() => {
    if (selected.size > 0) setTimeout(() => titleRef.current?.focus(), 100)
  }, [selected.size > 0])

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) { onClose(); return }

    const gpsMap: Record<number, { latitude: number; longitude: number } | null> = {}

    const initial: ImportedPhoto[] = await Promise.all(
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
          id: `${i}-${file.name}-${file.size}`,
          file,
          preview: URL.createObjectURL(file),
          date,
          time,
          locationName: '',
          locationPending: !!gpsMap[i],
          type: 'other' as ActivityType,
          typePending: true,
          assigned: false,
        }
      })
    )

    previewsRef.current = initial.map(d => d.preview)
    setPhotos(initial)
    setPhase('organize')

    // Background: Gemini classify
    files.forEach((file, i) => {
      const fd = new FormData()
      fd.append('file', file)
      fetch('/api/classify-activity', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => setPhotos(prev => prev.map((p, idx) =>
          idx === i ? { ...p, type: data.type ?? 'other', typePending: false } : p
        )))
        .catch(() => setPhotos(prev => prev.map((p, idx) =>
          idx === i ? { ...p, typePending: false } : p
        )))
    })

    // Background: geocode GPS (sequential, Nominatim 1 req/s)
    ;(async () => {
      for (let i = 0; i < files.length; i++) {
        const gps = gpsMap[i]
        if (!gps) {
          setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, locationPending: false } : p))
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
            .filter((v, j, a) => a.indexOf(v) === j)
            .join(', ')
          setPhotos(prev => prev.map((p, idx) =>
            idx === i ? { ...p, locationName, locationPending: false } : p
          ))
        } catch {
          setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, locationPending: false } : p))
        }
      }
    })()
  }

  const toggleSelect = (id: string) => {
    if (phase !== 'organize') return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // When selection changes, auto-fill type from first selected photo
  const updateFormFromSelection = (newSelected: Set<string>) => {
    const firstId = [...newSelected][0]
    if (!firstId) return
    const photo = photos.find(p => p.id === firstId)
    if (photo && !photo.typePending) setMemType(photo.type)
  }

  const handleToggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    if (next.size > 0) updateFormFromSelection(next)
    if (next.size === 0) setTitle('')
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

    // Upload all selected photos via API route
    const uploadedUrls: string[] = []
    for (const photo of selectedPhotos) {
      try {
        const fd = new FormData()
        fd.append('file', photo.file)
        const res = await fetch('/api/upload-activity-photo', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.url) uploadedUrls.push(data.url)
      } catch {}
    }

    // Use first photo's EXIF for date/location
    const first = selectedPhotos[0]
    const locationName = selectedPhotos.find(p => p.locationName)?.locationName ?? ''

    await supabase.from('activities').insert({
      trip_id: tripId,
      user_id: user.id,
      title: title.trim(),
      activity_type: memType,
      entry_type: 'memory',
      scheduled_at: `${first.date}T${first.time}:00`,
      location_name: locationName || null,
      photos: uploadedUrls,
      cost_currency: detectCurrencyCode(locationName, tripDestination),
      is_expandable: false,
      photo_details: [],
    })

    // Mark photos as assigned
    const assignedIds = new Set(selected)
    setPhotos(prev => prev.map(p => assignedIds.has(p.id) ? { ...p, assigned: true } : p))
    setSelected(new Set())
    setTitle('')
    setMemType('other')
    setMemoriesCreated(c => c + 1)
    setSavingMemory(false)
  }

  const finish = () => {
    if (memoriesCreated > 0) {
      toast.success(`${memoriesCreated} souvenir${memoriesCreated > 1 ? 's' : ''} créé${memoriesCreated > 1 ? 's' : ''} ! 📸`)
      onDone()
    } else {
      onClose()
    }
  }

  // ─── Select phase ───
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

  const unassigned = photos.filter(p => !p.assigned)
  const selectedList = photos.filter(p => selected.has(p.id))
  const firstSelected = selectedList[0]

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-14">
        <button
          onClick={finish}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: '#F0E8DC', color: '#8A7B6A' }}
        >
          ← Terminer
        </button>

        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: '#2C2416' }}>
            {unassigned.length} photo{unassigned.length !== 1 ? 's' : ''} restante{unassigned.length !== 1 ? 's' : ''}
          </p>
          {memoriesCreated > 0 && (
            <p className="text-[10px]" style={{ color: '#8A7B6A' }}>
              {memoriesCreated} souvenir{memoriesCreated > 1 ? 's' : ''} créé{memoriesCreated > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="w-16" />
      </div>

      {/* Instruction */}
      {selected.size === 0 && (
        <p className="px-5 pb-2 text-xs" style={{ color: '#B5A89A' }}>
          Sélectionne les photos d'un même souvenir
        </p>
      )}

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto px-4">
        {unassigned.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl">🎉</div>
            <p className="text-base font-bold" style={{ color: '#2C2416' }}>Toutes les photos sont assignées !</p>
            <p className="text-sm" style={{ color: '#8A7B6A' }}>{memoriesCreated} souvenir{memoriesCreated > 1 ? 's' : ''} créé{memoriesCreated > 1 ? 's' : ''}</p>
            <button
              onClick={finish}
              className="mt-4 rounded-2xl px-6 py-3 text-sm font-bold text-white"
              style={{ background: '#C2714A' }}
            >
              Voir le voyage ✓
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 pb-56">
            {unassigned.map(photo => {
              const isSel = selected.has(photo.id)
              const selIdx = selectedList.findIndex(p => p.id === photo.id)
              return (
                <button
                  key={photo.id}
                  onClick={() => handleToggle(photo.id)}
                  className="relative aspect-square overflow-hidden rounded-xl transition active:scale-95"
                  style={{ border: isSel ? '2.5px solid #C2714A' : '2.5px solid transparent' }}
                >
                  <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                  {/* Pending indicators */}
                  {(photo.locationPending || photo.typePending) && !isSel && (
                    <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-white/60" />
                  )}
                  {/* Selection badge */}
                  {isSel && (
                    <div
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: '#C2714A' }}
                    >
                      {selIdx + 1}
                    </div>
                  )}
                  {/* Overlay when selected */}
                  {isSel && (
                    <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(194,113,74,0.15)' }} />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom form — slides up when photos are selected */}
      {selected.size > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-[2rem] bg-white px-5 pb-10 pt-5 shadow-2xl"
          style={{ animation: 'slideUp 0.25s ease-out' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: '#2C2416' }}>
              {selected.size} photo{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
            </p>
            <button
              onClick={() => { setSelected(new Set()); setTitle('') }}
              className="text-xs"
              style={{ color: '#B5A89A' }}
            >
              Désélectionner
            </button>
          </div>

          {/* Type selector */}
          <div className="mb-3 flex items-center gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMemType(t.value)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition active:scale-90"
                style={{ background: memType === t.value ? '#C2714A' : '#F5EDE4' }}
                title={t.label}
              >{t.emoji}</button>
            ))}
          </div>

          {/* Title input */}
          <input
            ref={titleRef}
            type="text"
            placeholder="Titre du souvenir *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createMemory()}
            className={`w-full rounded-2xl border px-4 py-3.5 text-sm outline-none placeholder:text-[#B5A89A] ${shakingTitle ? 'animate-[shake_0.45s_ease]' : ''}`}
            style={{
              borderColor: shakingTitle ? '#C2714A' : '#E8DFD0',
              color: '#2C2416',
              background: '#FAFAF7',
            }}
          />

          {/* Date + location from first selected photo */}
          {firstSelected && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: '#F5EDE4', color: '#8A7B6A' }}>
                📅 {new Date(firstSelected.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </span>
              {firstSelected.locationPending ? (
                <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: '#F5EDE4', color: '#B5A89A' }}>
                  🔍 Lieu en cours…
                </span>
              ) : firstSelected.locationName ? (
                <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: '#F5EDE4', color: '#8A7B6A' }}>
                  📍 {firstSelected.locationName}
                </span>
              ) : null}
            </div>
          )}

          {/* Create button */}
          <button
            type="button"
            onClick={createMemory}
            disabled={savingMemory}
            className="mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: '#C2714A' }}
          >
            {savingMemory ? 'Création…' : `Créer ce souvenir →`}
          </button>
        </div>
      )}
    </div>
  )
}
