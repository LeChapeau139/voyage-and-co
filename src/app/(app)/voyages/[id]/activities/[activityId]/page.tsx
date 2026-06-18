'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Activity, ActivityType, PhotoDetail } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'
import PageFade from '@/components/PageFade'

const TYPE_CONFIG: Record<ActivityType, { emoji: string; label: string; color: string }> = {
  food:      { emoji: '🍽️', label: 'Repas',     color: '#F59E0B' },
  culture:   { emoji: '🏛️', label: 'Culture',   color: '#6B8F71' },
  transport: { emoji: '🚌', label: 'Transport', color: '#6B8AAF' },
  hotel:     { emoji: '🏨', label: 'Séjour',    color: '#9B72A8' },
  nature:    { emoji: '🌿', label: 'Nature',    color: '#5A9E72' },
  other:     { emoji: '📍', label: 'Autre',     color: '#C2714A' },
}

function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95" onClick={onClose}>
      <button className="absolute right-5 top-5 text-white/70" onClick={onClose}>
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img src={src} alt="" className="max-h-full max-w-full object-contain px-4" onClick={e => e.stopPropagation()} />
    </div>
  )
}

export default function ActivityDetailPage() {
  const { id: tripId, activityId } = useParams<{ id: string; activityId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  // Add photo state
  const [addingPhoto, setAddingPhoto] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [pendingCaption, setPendingCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  // Edit caption state
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editCaption, setEditCaption] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data: act } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single()

      if (!act) { setLoading(false); return }
      setActivity(act)

      if (user) {
        const { data: member } = await supabase
          .from('trip_members')
          .select('id')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .maybeSingle()

        const isOwner = act.user_id === user.id
        const isTripOwner = await supabase.from('trips').select('user_id').eq('id', tripId).single()
          .then(r => r.data?.user_id === user.id)
        setCanEdit(isOwner || !!member || isTripOwner)
      }
      setLoading(false)
    }
    fetchData()
  }, [activityId, tripId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPendingPreview(URL.createObjectURL(file))
    setPendingCaption('')
    setAddingPhoto(true)
    e.target.value = ''
  }

  const savePhoto = async () => {
    if (!pendingFile || !activity) return
    setUploading(true)

    const fd = new FormData()
    fd.append('file', pendingFile)
    const res = await fetch('/api/upload-activity-photo', { method: 'POST', body: fd })
    const data = await res.json()

    if (!data.url) {
      toast.error('Échec du téléversement')
      setUploading(false)
      return
    }

    const newDetails: PhotoDetail[] = [
      ...(activity.photo_details ?? []),
      { url: data.url, caption: pendingCaption.trim() || null },
    ]

    await supabase.from('activities').update({ photo_details: newDetails }).eq('id', activity.id)
    setActivity(prev => prev ? { ...prev, photo_details: newDetails } : prev)
    toast.success('Photo ajoutée ✨')

    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(null)
    setPendingPreview(null)
    setPendingCaption('')
    setAddingPhoto(false)
    setUploading(false)
  }

  const saveCaption = async (idx: number) => {
    if (!activity) return
    const newDetails = activity.photo_details.map((p, i) =>
      i === idx ? { ...p, caption: editCaption.trim() || null } : p
    )
    await supabase.from('activities').update({ photo_details: newDetails }).eq('id', activity.id)
    setActivity(prev => prev ? { ...prev, photo_details: newDetails } : prev)
    setEditingIdx(null)
  }

  const removePhoto = async (idx: number) => {
    if (!activity) return
    const newDetails = activity.photo_details.filter((_, i) => i !== idx)
    await supabase.from('activities').update({ photo_details: newDetails }).eq('id', activity.id)
    setActivity(prev => prev ? { ...prev, photo_details: newDetails } : prev)
    toast.success('Photo retirée')
  }

  if (loading) {
    return (
      <div className="px-5 pt-14">
        <div className="h-5 w-20 animate-pulse rounded-xl mb-6" style={{ background: '#F0E8DC' }} />
        <div className="h-64 w-full animate-pulse rounded-2xl" style={{ background: '#F0E8DC' }} />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 pt-32 text-center">
        <span className="text-5xl">📭</span>
        <p className="font-semibold" style={{ color: '#2C2416' }}>Souvenir introuvable</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#C2714A' }}>← Retour</button>
      </div>
    )
  }

  const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG.other
  const dateLabel = new Date(activity.scheduled_at).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeLabel = new Date(activity.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <PageFade>
      <div className="min-h-screen pb-32" style={{ background: '#FAF8F5' }}>

        {/* Hero — première photo du souvenir */}
        {activity.photos.length > 0 ? (
          <div className="relative">
            <img
              src={activity.photos[0]}
              alt=""
              className="w-full object-cover cursor-pointer"
              style={{ maxHeight: '340px' }}
              onClick={() => setLightboxSrc(activity.photos[0])}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
            <button
              onClick={() => router.back()}
              className="absolute left-4 top-12 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{cfg.emoji}</span>
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">{cfg.label}</span>
              </div>
              <h1 className="text-xl font-bold text-white drop-shadow">{activity.title}</h1>
            </div>
          </div>
        ) : (
          <div className="relative px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)' }}>
            <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm font-medium" style={{ color: '#8A7B6A' }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{cfg.emoji}</span>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: '#2C2416' }}>{activity.title}</h1>
          </div>
        )}

        <div className="px-5 pt-5 flex flex-col gap-5">

          {/* Infos */}
          <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(44,36,22,0.06)' }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#8A7B6A' }}>
              <span>🗓</span>
              <span className="capitalize">{dateLabel}</span>
              <span className="text-xs" style={{ color: '#B5A89A' }}>· {timeLabel}</span>
            </div>
            {activity.location_name && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#8A7B6A' }}>
                <span>📍</span>
                <span>{activity.location_name}</span>
              </div>
            )}
            {activity.description && (
              <p className="text-sm leading-relaxed pt-1" style={{ color: '#2C2416', borderTop: '1px solid #F0E8DC' }}>
                "{activity.description}"
              </p>
            )}
          </div>

          {/* Photos du souvenir (celles de la timeline) */}
          {activity.photos.length > 1 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Photos</p>
              <div className="grid grid-cols-3 gap-2">
                {activity.photos.map((url, i) => (
                  <img key={i} src={url} alt="" onClick={() => setLightboxSrc(url)}
                    className="w-full cursor-pointer rounded-xl object-cover transition active:scale-[0.97]"
                    style={{ aspectRatio: '1/1' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Galerie détaillée avec légendes */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>
                Galerie & anecdotes
              </p>
              {canEdit && (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                  style={{ background: '#C2714A' }}
                >
                  <span>+</span> Photo
                </button>
              )}
            </div>

            {activity.photo_details.length === 0 && !addingPhoto && (
              <div className="flex flex-col items-center gap-2 py-10 text-center rounded-2xl"
                style={{ background: '#FFFFFF', border: '2px dashed #E8DFD0' }}
              >
                <span className="text-4xl">📷</span>
                <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Aucune photo pour l'instant</p>
                {canEdit && (
                  <p className="text-xs" style={{ color: '#B5A89A' }}>
                    Appuie sur "+ Photo" pour enrichir ce souvenir
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-5">
              {activity.photo_details.map((item, idx) => (
                <div key={idx} className="overflow-hidden rounded-2xl"
                  style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(44,36,22,0.09)' }}
                >
                  <img src={item.url} alt="" onClick={() => setLightboxSrc(item.url)}
                    className="w-full cursor-pointer object-cover transition active:scale-[0.99]"
                    style={{ maxHeight: '320px' }}
                  />
                  <div className="px-4 py-3">
                    {editingIdx === idx ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editCaption}
                          onChange={e => setEditCaption(e.target.value)}
                          placeholder="Écris une anecdote..."
                          rows={3}
                          autoFocus
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none placeholder:text-[#B5A89A]"
                          style={{ borderColor: '#E8DFD0', color: '#2C2416' }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setEditingIdx(null)}
                            className="flex-1 rounded-xl py-2 text-xs font-semibold"
                            style={{ background: '#F7F2EA', color: '#8A7B6A' }}
                          >Annuler</button>
                          <button onClick={() => saveCaption(idx)}
                            className="flex-1 rounded-xl py-2 text-xs font-semibold text-white"
                            style={{ background: '#C2714A' }}
                          >Enregistrer</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 text-sm leading-relaxed"
                          style={{ color: item.caption ? '#2C2416' : '#B5A89A', fontStyle: item.caption ? 'normal' : 'italic' }}
                        >
                          {item.caption || (canEdit ? 'Ajouter une légende...' : '')}
                        </p>
                        {canEdit && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => { setEditingIdx(idx); setEditCaption(item.caption ?? '') }}
                              className="rounded-full p-1.5 transition active:scale-90"
                              style={{ color: '#B5A89A' }}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => removePhoto(idx)}
                              className="rounded-full p-1.5 transition active:scale-90"
                              style={{ color: '#DC5E4A' }}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Ajout d'une nouvelle photo */}
              {addingPhoto && pendingPreview && (
                <div className="overflow-hidden rounded-2xl" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(44,36,22,0.09)' }}>
                  <img src={pendingPreview} alt="" className="w-full object-cover" style={{ maxHeight: '320px' }} />
                  <div className="px-4 py-3 flex flex-col gap-2">
                    <textarea
                      value={pendingCaption}
                      onChange={e => setPendingCaption(e.target.value)}
                      placeholder="Légende ou anecdote (optionnel)..."
                      rows={2}
                      autoFocus
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none placeholder:text-[#B5A89A]"
                      style={{ borderColor: '#E8DFD0', color: '#2C2416' }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setAddingPhoto(false); setPendingFile(null); if (pendingPreview) URL.revokeObjectURL(pendingPreview); setPendingPreview(null) }}
                        className="flex-1 rounded-xl py-2.5 text-xs font-semibold"
                        style={{ background: '#F7F2EA', color: '#8A7B6A' }}
                      >Annuler</button>
                      <button onClick={savePhoto} disabled={uploading}
                        className="flex-1 rounded-xl py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: '#C2714A' }}
                      >
                        {uploading ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Upload...
                          </span>
                        ) : 'Ajouter'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {lightboxSrc && <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      </div>
    </PageFade>
  )
}
