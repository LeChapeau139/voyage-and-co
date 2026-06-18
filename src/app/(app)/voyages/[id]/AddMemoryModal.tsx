'use client'

import { useRef, useState } from 'react'
import exifr from 'exifr'
import { supabase } from '@/lib/supabase'
import type { Activity, ActivityType } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'

interface Props {
  tripId: string
  prefill?: { title?: string; activityType?: ActivityType; locationName?: string }
  activity?: Activity
  onClose: () => void
  onCreated: () => void
}

const TYPES: { value: ActivityType; emoji: string; label: string }[] = [
  { value: 'food',      emoji: '🍽️', label: 'Repas' },
  { value: 'culture',   emoji: '🏛️', label: 'Culture' },
  { value: 'nature',    emoji: '🌿', label: 'Nature' },
  { value: 'hotel',     emoji: '🏨', label: 'Séjour' },
  { value: 'transport', emoji: '🚌', label: 'Transport' },
  { value: 'other',     emoji: '📍', label: 'Autre' },
]

function todayStr() { return new Date().toISOString().split('T')[0] }
function nowTimeStr() { return new Date().toTimeString().slice(0, 5) }

export default function AddMemoryModal({ tripId, prefill, activity, onClose, onCreated }: Props) {
  const { toast } = useToast()
  const isEdit = !!activity

  const [title, setTitle] = useState(activity?.title ?? prefill?.title ?? '')
  const [type, setType] = useState<ActivityType>(activity?.activity_type ?? prefill?.activityType ?? 'other')
  const [note, setNote] = useState(activity?.description ?? '')
  const [locationName, setLocationName] = useState(activity?.location_name ?? prefill?.locationName ?? '')
  const [date, setDate] = useState(() => {
    if (activity?.scheduled_at) return activity.scheduled_at.split('T')[0]
    return todayStr()
  })
  const [time, setTime] = useState(() => {
    if (activity?.scheduled_at) return activity.scheduled_at.slice(11, 16)
    return nowTimeStr()
  })

  const [existingPhotos, setExistingPhotos] = useState<string[]>(activity?.photos ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [exifFilled, setExifFilled] = useState<'date' | 'location' | 'both' | null>(null)
  const [exifEmpty, setExifEmpty] = useState(false)
  const [readingExif, setReadingExif] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = 6 - existingPhotos.length - newFiles.length
    const toAdd = files.slice(0, remaining)
    setNewFiles(prev => [...prev, ...toAdd])
    setNewPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''

    // Auto-fill from first photo only, in create mode
    if (!isEdit && newFiles.length === 0 && toAdd.length > 0) {
      setReadingExif(true)
      try {
        // Read date fields (multiple fallbacks)
        const dateExif = await exifr.parse(toAdd[0], {
          pick: ['DateTimeOriginal', 'DateTime', 'CreateDate', 'DateCreated'],
        }).catch(() => null)

        // Read GPS via dedicated method (handles GPS IFD properly)
        const gps = await exifr.gps(toAdd[0]).catch(() => null)

        let filledDate = false
        let filledLocation = false

        const rawDate = dateExif?.DateTimeOriginal ?? dateExif?.DateTime ?? dateExif?.CreateDate ?? dateExif?.DateCreated
        if (rawDate) {
          const d = rawDate instanceof Date ? rawDate : new Date(rawDate)
          if (!isNaN(d.getTime())) {
            setDate(d.toISOString().split('T')[0])
            setTime(d.toTimeString().slice(0, 5))
            filledDate = true
          }
        }

        if (gps?.latitude && gps?.longitude) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${gps.latitude}&lon=${gps.longitude}&format=json&accept-language=fr`
            )
            const geo = await res.json()
            const addr = geo.address ?? {}
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county
            const country = addr.country
            if (city || country) {
              setLocationName([city, country].filter(Boolean).join(', '))
              filledLocation = true
            }
          } catch { /* pas de réseau */ }
        }

        if (filledDate && filledLocation) setExifFilled('both')
        else if (filledDate) setExifFilled('date')
        else if (filledLocation) setExifFilled('location')
        else setExifEmpty(true)
      } catch { setExifEmpty(true) }
      setReadingExif(false)
    }
  }

  const removeExisting = (idx: number) =>
    setExistingPhotos(prev => prev.filter((_, i) => i !== idx))

  const removeNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx])
    setNewFiles(prev => prev.filter((_, i) => i !== idx))
    setNewPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setUploading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setUploading(false); return }

    const uploadedUrls: string[] = []
    for (const file of newFiles) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-activity-photo', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) uploadedUrls.push(data.url)
      else { toast.error('Échec du téléversement photo'); setError('Erreur upload photo'); setUploading(false); return }
    }

    const allPhotos = [...existingPhotos, ...uploadedUrls]
    const scheduledAt = date ? `${date}T${time || '12:00'}:00` : new Date().toISOString()

    if (isEdit && activity) {
      const { error: updateError } = await supabase.from('activities').update({
        title: title.trim(),
        activity_type: type,
        description: note.trim() || null,
        location_name: locationName.trim() || null,
        scheduled_at: scheduledAt,
        photos: allPhotos,
      }).eq('id', activity.id)
      if (updateError) { setError(updateError.message); setUploading(false); return }
      toast.success('Souvenir modifié ✏️')
    } else {
      const { error: insertError } = await supabase.from('activities').insert({
        trip_id: tripId,
        user_id: user.id,
        title: title.trim(),
        activity_type: type,
        entry_type: 'memory',
        scheduled_at: scheduledAt,
        description: note.trim() || null,
        location_name: locationName.trim() || null,
        photos: allPhotos,
      })
      if (insertError) { setError(insertError.message); setUploading(false); return }
      toast.success('Souvenir publié 📸')
    }

    onCreated()
  }

  const totalPhotos = existingPhotos.length + newFiles.length
  const canAddMore = totalPhotos < 6
  const inputClass = "w-full rounded-2xl border px-4 py-3.5 text-sm outline-none placeholder:text-[#B5A89A]"
  const inputStyle = { borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#2C2416' }}>
            {isEdit ? 'Modifier le souvenir ✏️' : 'Nouveau souvenir 📸'}
          </h2>
          <button onClick={onClose} style={{ color: '#B5A89A' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Photo strip */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {existingPhotos.map((url, i) => (
              <div key={`ex-${i}`} className="relative flex-shrink-0">
                <img src={url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                <button type="button" onClick={() => removeExisting(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#DC5E4A' }}
                >×</button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative flex-shrink-0">
                <img src={url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                <button type="button" onClick={() => removeNew(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#DC5E4A' }}
                >×</button>
              </div>
            ))}
            {canAddMore && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', border: '2px dashed #D4B89A' }}
              >
                {readingExif ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4B89A] border-t-[#C2714A]" />
                ) : (
                  <>
                    <span className="text-xl">📷</span>
                    <span className="text-[9px] font-semibold" style={{ color: '#C2714A' }}>
                      {totalPhotos === 0 ? 'Photo' : '+'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />

          {/* EXIF badge */}
          {exifFilled && (
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: '#F0F7F0' }}>
              <span className="text-sm">✨</span>
              <p className="text-xs font-medium" style={{ color: '#5A8A6A' }}>
                {exifFilled === 'both' && 'Date et lieu détectés depuis ta photo'}
                {exifFilled === 'date' && 'Date détectée depuis ta photo'}
                {exifFilled === 'location' && 'Lieu détecté depuis ta photo'}
                {' — '}
                <button type="button" onClick={() => setExifFilled(null)} className="underline">
                  modifier
                </button>
              </p>
            </div>
          )}
          {exifEmpty && !exifFilled && (
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: '#F7F2EA' }}>
              <span className="text-sm">📷</span>
              <p className="text-xs" style={{ color: '#8A7B6A' }}>
                Pas de métadonnées dans cette photo — remplis manuellement
              </p>
            </div>
          )}

          {/* Type */}
          <div className="grid grid-cols-6 gap-1.5">
            {TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition active:scale-95"
                style={{
                  background: type === t.value ? '#F5E8DF' : '#FAFAF7',
                  border: `1.5px solid ${type === t.value ? '#C2714A' : '#E8DFD0'}`,
                  color: type === t.value ? '#C2714A' : '#8A7B6A',
                }}
              >
                <span className="text-lg">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            type="text" placeholder="Qu'as-tu fait ? *" value={title}
            onChange={e => setTitle(e.target.value)} required
            className={inputClass} style={inputStyle}
          />

          {/* Location */}
          <input
            type="text" placeholder="📍 Lieu (optionnel)" value={locationName}
            onChange={e => setLocationName(e.target.value)}
            className={inputClass} style={inputStyle}
          />

          {/* Date + Time */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className={inputClass} style={inputStyle}
              />
            </div>
            <div className="w-28 flex-shrink-0">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#B5A89A' }}>Heure</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className={inputClass} style={inputStyle}
              />
            </div>
          </div>

          {/* Note */}
          <textarea
            placeholder="Une note, une anecdote... (optionnel)"
            value={note} onChange={e => setNote(e.target.value)} rows={2}
            className={`${inputClass} resize-none`} style={inputStyle}
          />

          {error && <p className="text-sm" style={{ color: '#DC5E4A' }}>{error}</p>}

          <button type="submit" disabled={!title.trim() || uploading}
            className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {newFiles.length > 0 ? `Upload ${newFiles.length} photo${newFiles.length > 1 ? 's' : ''}...` : 'Enregistrement...'}
              </span>
            ) : isEdit ? '✅ Enregistrer les modifications' : '✨ Publier le souvenir'}
          </button>
        </form>
      </div>
    </div>
  )
}
