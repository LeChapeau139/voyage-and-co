'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Activity, ActivityType, Trip } from '@/lib/types'
import PageFade from '@/components/PageFade'

const TYPE_CONFIG: Record<ActivityType, { emoji: string; color: string; dot: string }> = {
  food:      { emoji: '🍽️', color: '#FEF3C7', dot: '#F59E0B' },
  culture:   { emoji: '🏛️', color: '#E8F0E9', dot: '#6B8F71' },
  transport: { emoji: '🚌', color: '#E8EFF7', dot: '#6B8AAF' },
  hotel:     { emoji: '🏨', color: '#F3E8F5', dot: '#9B72A8' },
  nature:    { emoji: '🌿', color: '#DCEEDE', dot: '#5A9E72' },
  other:     { emoji: '📍', color: '#F7F2EA', dot: '#C2714A' },
}

function PhotoGrid({ photos, onPhotoClick }: { photos: string[]; onPhotoClick: (s: string) => void }) {
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
          <img src={p} alt="" className="w-full rounded-2xl object-cover" style={{ aspectRatio: '1/1' }} />
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

function MemoryCard({ activity, onPhotoClick }: { activity: Activity; onPhotoClick: (s: string) => void }) {
  const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG.other
  const time = new Date(activity.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const hasPhotos = activity.photos.length > 0

  return (
    <div className="overflow-hidden rounded-3xl"
      style={{
        background: hasPhotos ? '#FFFFFF' : cfg.color,
        boxShadow: hasPhotos ? '0 4px 20px rgba(44,36,22,0.12)' : '0 2px 8px rgba(44,36,22,0.06)',
      }}
    >
      {hasPhotos && <PhotoGrid photos={activity.photos} onPhotoClick={onPhotoClick} />}
      <div className={hasPhotos ? 'px-4 pb-4' : 'p-4'}>
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.emoji}</span>
          <span className="text-xs font-semibold" style={{ color: cfg.dot }}>{time}</span>
          {activity.entry_type === 'planned' && (
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#E8EFF7', color: '#6B8AAF' }}>
              Planifié
            </span>
          )}
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
      >{label}</span>
      <div className="h-px flex-1" style={{ background: '#E8DFD0' }} />
    </div>
  )
}

export default function PublicTripPage() {
  const { userId, tripId } = useParams<{ userId: string; tripId: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: t } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('is_public', true)
        .single()

      if (!t) { setLoading(false); return }
      setTrip(t)

      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', tripId)
        .eq('entry_type', 'memory')
        .order('scheduled_at', { ascending: true })
      setActivities(acts ?? [])
      setLoading(false)
    }
    fetchData()
  }, [tripId])

  const grouped = activities.reduce<Record<string, Activity[]>>((acc, act) => {
    const day = act.scheduled_at.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(act)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="px-5 pt-14">
        <div className="h-6 w-24 animate-pulse rounded-xl mb-6" style={{ background: '#F0E8DC' }} />
        <div className="h-44 animate-pulse rounded-3xl" style={{ background: '#F0E8DC' }} />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 pt-32 text-center">
        <span className="text-5xl">🔒</span>
        <p className="font-semibold" style={{ color: '#2C2416' }}>Voyage introuvable ou privé</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#C2714A' }}>← Retour</button>
      </div>
    )
  }

  return (
    <PageFade>
      <div className="min-h-screen pb-28" style={{ background: '#FAF8F5' }}>
        {/* Header */}
        <div className="flex items-center px-5 pt-12 pb-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#8A7B6A' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        </div>

        {/* Hero */}
        <div className="mx-5 mb-6 overflow-hidden rounded-3xl" style={{ height: '180px', boxShadow: '0 4px 16px rgba(44,36,22,0.1)' }}>
          {trip.cover_url
            ? <img src={trip.cover_url} alt={trip.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, #E8D5C0, #C4956A)' }} />
          }
          <div className="relative -mt-[180px] h-[180px]"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)' }}
          >
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="mb-1 flex items-center gap-2">
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
            <div className="mt-12 flex flex-col items-center gap-3 text-center">
              <span className="text-5xl">📷</span>
              <p className="font-bold" style={{ color: '#2C2416' }}>Aucun souvenir partagé</p>
              <p className="text-sm" style={{ color: '#8A7B6A' }}>Ce voyageur n'a pas encore ajouté de souvenirs</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(grouped).map(([day, acts]) => (
                <div key={day} className="flex flex-col gap-3">
                  <DaySeparator date={`${day}T12:00:00`} />
                  {acts.map(act => (
                    <MemoryCard key={act.id} activity={act} onPhotoClick={setLightboxSrc} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95" onClick={() => setLightboxSrc(null)}>
          <button className="absolute right-5 top-5 text-white/70" onClick={() => setLightboxSrc(null)}>
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={lightboxSrc} alt="" className="max-h-full max-w-full object-contain px-4" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </PageFade>
  )
}
