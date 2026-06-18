'use client'

import { useRef, useState } from 'react'
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

export default function AddMemoryModal({ tripId, prefill, activity, onClose, onCreated }: Props) {
  const { toast } = useToast()
  const isEdit = !!activity
  const [title, setTitle] = useState(activity?.title ?? prefill?.title ?? '')
  const [type, setType] = useState<ActivityType>(activity?.activity_type ?? prefill?.activityType ?? 'other')
  const [note, setNote] = useState(activity?.description ?? '')
  const [locationName] = useState(activity?.location_name ?? prefill?.locationName ?? '')

  // Existing photos (edit mode) — can be removed individually
  const [existingPhotos, setExistingPhotos] = useState<string[]>(activity?.photos ?? [])
  // New files to upload
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 6 - existingPhotos.length - newFiles.length
    const toAdd = files.slice(0, remaining)
    setNewFiles(prev => [...prev, ...toAdd])
    setNewPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeExisting = (idx: number) =>
    setExistingPhotos(prev => prev.filter((_, i) => i !== idx))

  const removeNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx])
    setNewFiles(prev => prev.filter((_, i) => i !== idx))
    setNewPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const totalPhotos = existingPhotos.length + newFiles.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setUploading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setUploading(false); return }

    // Upload new photos
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

    if (isEdit && activity) {
      const { error: updateError } = await supabase.from('activities').update({
        title: title.trim(),
        activity_type: type,
        description: note.trim() || null,
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
        scheduled_at: new Date().toISOString(),
        description: note.trim() || null,
        location_name: locationName || null,
        photos: allPhotos,
      })
      if (insertError) { setError(insertError.message); setUploading(false); return }
      toast.success('Souvenir publié 📸')
    }

    onCreated()
  }

  const canAddMore = totalPhotos < 6

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
            {/* Existing photos */}
            {existingPhotos.map((url, i) => (
              <div key={`ex-${i}`} className="relative flex-shrink-0">
                <img src={url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                <button type="button" onClick={() => removeExisting(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#DC5E4A' }}
                >×</button>
              </div>
            ))}
            {/* New photos */}
            {newPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative flex-shrink-0">
                <img src={url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                <button type="button" onClick={() => removeNew(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#DC5E4A' }}
                >×</button>
              </div>
            ))}
            {/* Add button */}
            {canAddMore && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)',
                  border: '2px dashed #D4B89A',
                }}
              >
                <span className="text-xl">📷</span>
                <span className="text-[9px] font-semibold" style={{ color: '#C2714A' }}>
                  {totalPhotos === 0 ? 'Photo' : '+'}
                </span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />

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
            className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none placeholder:text-[#B5A89A]"
            style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
          />

          {/* Note */}
          <textarea
            placeholder="Une note, une anecdote... (optionnel)"
            value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full resize-none rounded-2xl border px-4 py-3.5 text-sm outline-none placeholder:text-[#B5A89A]"
            style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
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
