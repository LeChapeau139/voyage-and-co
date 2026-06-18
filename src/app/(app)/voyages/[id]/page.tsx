'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Trip, Activity, ActivityType } from '@/lib/types'
import { useCreateAction } from '@/contexts/CreateActionContext'
import { useToast } from '@/contexts/ToastContext'
import AddMemoryModal from './AddMemoryModal'
import PageFade from '@/components/PageFade'

const TYPE_CONFIG: Record<ActivityType, { emoji: string; color: string; dot: string }> = {
  food:      { emoji: '🍽️', color: '#FEF3C7', dot: '#F59E0B' },
  culture:   { emoji: '🏛️', color: '#E8F0E9', dot: '#6B8F71' },
  transport: { emoji: '🚌', color: '#E8EFF7', dot: '#6B8AAF' },
  hotel:     { emoji: '🏨', color: '#F3E8F5', dot: '#9B72A8' },
  nature:    { emoji: '🌿', color: '#DCEEDE', dot: '#5A9E72' },
  other:     { emoji: '📍', color: '#F7F2EA', dot: '#C2714A' },
}

function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button className="absolute right-5 top-5 text-white/70 transition hover:text-white" onClick={onClose}>
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src} alt=""
        className="max-h-full max-w-full object-contain px-4"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

function PhotoGrid({ photos, onPhotoClick }: { photos: string[]; onPhotoClick: (src: string) => void }) {
  if (photos.length === 0) return null
  if (photos.length === 1) {
    return (
      <img src={photos[0]} alt="" onClick={() => onPhotoClick(photos[0])}
        className="mb-3 w-full cursor-pointer rounded-2xl object-cover transition active:scale-[0.98]"
        style={{ maxHeight: '260px' }}
      />
    )
  }
  if (photos.length === 2) {
    return (
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {photos.map((p, i) => (
          <img key={i} src={p} alt="" onClick={() => onPhotoClick(p)}
            className="w-full cursor-pointer rounded-2xl object-cover transition active:scale-[0.98]"
            style={{ aspectRatio: '1/1' }}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="mb-3 grid grid-cols-2 gap-1.5">
      <img src={photos[0]} alt="" onClick={() => onPhotoClick(photos[0])}
        className="col-span-2 w-full cursor-pointer rounded-2xl object-cover transition active:scale-[0.98]"
        style={{ maxHeight: '200px' }}
      />
      {photos.slice(1, 3).map((p, i) => (
        <div key={i} className="relative cursor-pointer" onClick={() => onPhotoClick(p)}>
          <img src={p} alt="" className="w-full rounded-2xl object-cover transition active:scale-[0.98]" style={{ aspectRatio: '1/1' }} />
          {i === 1 && photos.length > 3 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55">
              <span className="text-xl font-bold text-white">+{photos.length - 3}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MemoryCard({
  activity,
  onPhotoClick,
  onEdit,
  onDelete,
}: {
  activity: Activity
  onPhotoClick: (src: string) => void
  onEdit: (a: Activity) => void
  onDelete: (a: Activity) => void
}) {
  const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG.other
  const time = new Date(activity.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const hasPhotos = activity.photos.length > 0

  return (
    <div className="relative overflow-hidden rounded-3xl"
      style={{
        background: hasPhotos ? '#FFFFFF' : cfg.color,
        boxShadow: hasPhotos ? '0 4px 20px rgba(44,36,22,0.12)' : '0 2px 8px rgba(44,36,22,0.06)',
      }}
    >
      {hasPhotos && <PhotoGrid photos={activity.photos} onPhotoClick={onPhotoClick} />}

      <div className={hasPhotos ? 'px-4 pb-4' : 'p-4'}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{cfg.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: cfg.dot }}>{time}</span>
            {activity.entry_type === 'planned' && (
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{ background: '#E8EFF7', color: '#6B8AAF' }}
              >Planifié</span>
            )}
          </div>
          {/* Action menu */}
          <div className="flex gap-1">
            <button onClick={() => onEdit(activity)}
              className="rounded-full p-1.5 transition active:scale-90"
              style={{ color: '#B5A89A' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(activity)}
              className="rounded-full p-1.5 transition active:scale-90"
              style={{ color: '#DC5E4A' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-1 font-bold leading-snug" style={{ color: '#2C2416' }}>{activity.title}</p>
        {activity.description && (
          <p className="mt-1 text-sm leading-relaxed" style={{ color: '#8A7B6A' }}>"{activity.description}"</p>
        )}
        {activity.location_name && (
          <p className="mt-1.5 text-xs font-medium" style={{ color: '#B5A89A' }}>📍 {activity.location_name}</p>
        )}
      </div>
    </div>
  )
}

function DaySeparator({ date }: { date: string }) {
  const label = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1" style={{ background: '#E8DFD0' }} />
      <span className="flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
        style={{ background: '#F5E8DF', color: '#C2714A' }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: '#E8DFD0' }} />
    </div>
  )
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const { setAction } = useCreateAction()
  const { toast } = useToast()

  const fetchData = async () => {
    const { data: t } = await supabase.from('trips').select('*').eq('id', id).single()
    setTrip(t)
    if (t) {
      const { data: acts } = await supabase
        .from('activities').select('*').eq('trip_id', id).order('scheduled_at', { ascending: true })
      setActivities(acts ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  useEffect(() => {
    setAction(() => setShowModal(true))
    return () => setAction(null)
  }, [setAction])

  const activate = async () => {
    await supabase.from('trips').update({ is_active: false }).neq('id', id)
    await supabase.from('trips').update({ is_active: true }).eq('id', id)
    fetchData()
  }

  const deleteTrip = async () => {
    setDeleting(true)
    await supabase.from('activities').delete().eq('trip_id', id)
    await supabase.from('trips').delete().eq('id', id)
    toast.success('Voyage supprimé')
    router.replace('/voyages')
  }

  const deleteActivity = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('activities').delete().eq('id', deleteTarget.id)
    toast.success('Souvenir supprimé')
    setDeleteTarget(null)
    setDeleting(false)
    fetchData()
  }

  const grouped = activities.reduce<Record<string, Activity[]>>((acc, act) => {
    const day = act.scheduled_at.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(act)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="px-5 pt-14">
        <div className="h-8 w-32 animate-pulse rounded-xl mb-6" style={{ background: '#F0E8DC' }} />
        <div className="h-40 animate-pulse rounded-3xl" style={{ background: '#F0E8DC' }} />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 pt-32 text-center">
        <div className="text-5xl">🗺️</div>
        <p className="font-semibold" style={{ color: '#2C2416' }}>Voyage introuvable</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#C2714A' }}>← Retour</button>
      </div>
    )
  }

  return (
    <PageFade>
      <div className="min-h-screen pb-28" style={{ background: '#FAF8F5' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#8A7B6A' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Mes voyages
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: '#FEF2F2', color: '#DC5E4A' }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>

        {/* Hero compact */}
        <div className="mx-5 mb-6 overflow-hidden rounded-3xl"
          style={{
            height: '180px',
            boxShadow: trip.is_active ? '0 8px 32px rgba(194,113,74,0.4)' : '0 4px 16px rgba(44,36,22,0.1)',
          }}
        >
          {trip.cover_url
            ? <img src={trip.cover_url} alt={trip.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, #E8D5C0, #C4956A)' }} />
          }
          <div className="relative -mt-[180px] h-[180px]"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)' }}
          >
            {trip.is_active && <div className="absolute inset-0 rounded-3xl ring-2 ring-[#C2714A]" />}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="mb-1 flex items-center gap-2">
                {trip.is_active
                  ? <span className="rounded-full bg-[#C2714A] px-2.5 py-0.5 text-[10px] font-bold text-white">✈️ En cours</span>
                  : <button onClick={activate} className="rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm" style={{ color: '#2C2416' }}>Activer</button>
                }
                <span className="text-[10px] text-white/60">{activities.length} souvenir{activities.length !== 1 ? 's' : ''}</span>
              </div>
              <h1 className="text-xl font-bold text-white drop-shadow-sm">{trip.name}</h1>
              {trip.destination && <p className="text-xs text-white/70">📍 {trip.destination}</p>}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-5">
          {Object.keys(grouped).length === 0 ? (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
                style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)' }}
              >📸</div>
              <p className="text-lg font-bold" style={{ color: '#2C2416' }}>Ton journal est vide</p>
              <p className="max-w-xs text-sm leading-relaxed" style={{ color: '#8A7B6A' }}>
                Appuie sur le <span className="font-semibold" style={{ color: '#C2714A' }}>+</span> pour documenter ton premier souvenir
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(grouped).map(([day, acts]) => (
                <div key={day} className="flex flex-col gap-3">
                  <DaySeparator date={`${day}T12:00:00`} />
                  {acts.map(act => (
                    <MemoryCard
                      key={act.id}
                      activity={act}
                      onPhotoClick={src => setLightboxSrc(src)}
                      onEdit={a => setEditActivity(a)}
                      onDelete={a => setDeleteTarget(a)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxSrc && <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

        {/* Delete activity sheet */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm">
            <div className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-5 shadow-2xl">
              <div className="mb-5 flex justify-center"><div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} /></div>
              <div className="mb-6 flex flex-col items-center gap-2 text-center">
                <div className="text-4xl">🗑️</div>
                <h3 className="text-lg font-bold" style={{ color: '#2C2416' }}>Supprimer ce souvenir ?</h3>
                <p className="text-sm font-semibold" style={{ color: '#8A7B6A' }}>"{deleteTarget.title}"</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={deleteActivity} disabled={deleting}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#DC5E4A' }}
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
                <button onClick={() => setDeleteTarget(null)}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold"
                  style={{ background: '#F7F2EA', color: '#8A7B6A' }}
                >Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete trip sheet */}
        {confirmDelete && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm">
            <div className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-5 shadow-2xl">
              <div className="mb-5 flex justify-center"><div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} /></div>
              <div className="mb-6 flex flex-col items-center gap-2 text-center">
                <div className="text-4xl">🗑️</div>
                <h3 className="text-lg font-bold" style={{ color: '#2C2416' }}>Supprimer ce voyage ?</h3>
                <p className="text-sm" style={{ color: '#8A7B6A' }}>
                  <span className="font-semibold" style={{ color: '#2C2416' }}>{trip.name}</span> et tous ses souvenirs seront supprimés.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={deleteTrip} disabled={deleting}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#DC5E4A' }}
                >
                  {deleting ? 'Suppression...' : 'Oui, supprimer'}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold"
                  style={{ background: '#F7F2EA', color: '#8A7B6A' }}
                >Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit memory modal */}
        {(showModal || editActivity) && (
          <AddMemoryModal
            tripId={trip.id}
            activity={editActivity ?? undefined}
            onClose={() => { setShowModal(false); setEditActivity(null) }}
            onCreated={() => { setShowModal(false); setEditActivity(null); fetchData() }}
          />
        )}
      </div>
    </PageFade>
  )
}
