'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Trip, Activity, ActivityType } from '@/lib/types'
import { useCreateAction } from '@/contexts/CreateActionContext'
import { useToast } from '@/contexts/ToastContext'
import AddMemoryModal from './AddMemoryModal'
import InviteMemberSheet from './InviteMemberSheet'
import PageFade from '@/components/PageFade'
import type { TripMember, Profile } from '@/lib/types'

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
  tripId,
  onPhotoClick,
  onEdit,
  onDelete,
}: {
  activity: Activity
  tripId: string
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
        {activity.is_expandable && (
          <Link href={`/voyages/${tripId}/activities/${activity.id}`}
            className="mt-2.5 flex items-center gap-1 text-xs font-semibold transition active:opacity-70"
            style={{ color: '#C2714A' }}
            onClick={e => e.stopPropagation()}
          >
            <span>Voir la page détaillée</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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
  const [showInvite, setShowInvite] = useState(false)
  const [members, setMembers] = useState<(TripMember & { profile?: Profile })[]>([])
  const [removeConfirm, setRemoveConfirm] = useState<(TripMember & { profile?: Profile }) | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverFileRef = useRef<HTMLInputElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { setAction } = useCreateAction()
  const { toast } = useToast()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    const { data: t } = await supabase.from('trips').select('*').eq('id', id).single()
    setTrip(t)
    if (t) {
      const [actsRes, membersRes] = await Promise.all([
        supabase.from('activities').select('*').eq('trip_id', id).order('scheduled_at', { ascending: true }),
        supabase.from('trip_members').select('*').eq('trip_id', id).neq('status', 'declined'),
      ])
      setActivities(actsRes.data ?? [])

      const membersList = membersRes.data ?? []
      if (membersList.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles').select('*').in('id', membersList.map(m => m.user_id))
        setMembers(membersList.map(m => ({ ...m, profile: profiles?.find(p => p.id === m.user_id) })))
      } else {
        setMembers([])
      }
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

  const togglePublic = async () => {
    const newValue = !trip?.is_public
    await supabase.from('trips').update({ is_public: newValue }).eq('id', id)
    toast.success(newValue ? 'Voyage rendu public 🌍' : 'Voyage rendu privé 🔒')
    fetchData()
  }

  const changeCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-activity-photo', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      await supabase.from('trips').update({ cover_url: data.url }).eq('id', id)
      toast.success('Cover mise à jour 📸')
      fetchData()
    } else {
      toast.error('Échec du téléversement')
    }
    setUploadingCover(false)
    e.target.value = ''
  }

  const leaveTrip = async () => {
    if (!currentUserId) return
    await supabase.from('trip_members').delete().eq('trip_id', id).eq('user_id', currentUserId)
    toast.success('Tu as quitté ce voyage')
    router.replace('/voyages')
  }

  const removeMember = async (userId: string) => {
    await supabase.from('trip_members').delete().eq('trip_id', id).eq('user_id', userId)
    toast.success('Membre retiré')
    fetchData()
  }

  const isOwner = trip?.user_id === currentUserId
  const acceptedMembers = members.filter(m => m.status === 'accepted')
  const pendingMembers = members.filter(m => m.status === 'pending')

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
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <button onClick={togglePublic}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95"
                  style={trip.is_public ? { background: '#E8F0E9', color: '#5A8A6A' } : { background: '#F7F2EA', color: '#8A7B6A' }}
                >
                  <span>{trip.is_public ? '🌍' : '🔒'}</span>
                  {trip.is_public ? 'Public' : 'Privé'}
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
              </>
            ) : (
              <button onClick={leaveTrip}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ background: '#FEF2F2', color: '#DC5E4A' }}
              >
                Quitter
              </button>
            )}
          </div>
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
          {isOwner && (
            <button
              onClick={() => coverFileRef.current?.click()}
              disabled={uploadingCover}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition active:scale-90 disabled:opacity-50"
            >
              {uploadingCover
                ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
              }
            </button>
          )}
          <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={changeCover} />
          <div className="relative -mt-[180px] h-[180px]"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)' }}
          >
            {trip.is_active && <div className="absolute inset-0 rounded-3xl ring-2 ring-[#C2714A]" />}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="mb-1 flex items-center gap-2 flex-wrap">
                {isOwner
                  ? trip.is_active
                    ? <span className="rounded-full bg-[#C2714A] px-2.5 py-0.5 text-[10px] font-bold text-white">✈️ En cours</span>
                    : <button onClick={activate} className="rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm" style={{ color: '#2C2416' }}>Activer</button>
                  : <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">👥 Collaborateur</span>
                }
                <span className="text-[10px] text-white/60">{activities.length} souvenir{activities.length !== 1 ? 's' : ''}</span>
              </div>
              <h1 className="text-xl font-bold text-white drop-shadow-sm">{trip.name}</h1>
              {trip.destination && <p className="text-xs text-white/70">📍 {trip.destination}</p>}

              {/* Membres row */}
              <div className="mt-2 flex items-center gap-1.5">
                {acceptedMembers.map(m => (
                  <button key={m.id}
                    onClick={() => isOwner ? setRemoveConfirm(m) : undefined}
                    className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-xs transition active:scale-90"
                    style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', border: '1.5px solid rgba(255,255,255,0.6)' }}
                    title={m.profile?.display_name || m.profile?.username || ''}
                  >
                    {m.profile?.avatar_url
                      ? <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      : m.profile?.avatar_emoji || '🧳'
                    }
                  </button>
                ))}
                {pendingMembers.map(m => (
                  <button key={m.id}
                    onClick={() => isOwner ? setRemoveConfirm(m) : undefined}
                    className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-xs transition active:scale-90 opacity-50"
                    style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', border: '1.5px dashed rgba(255,255,255,0.6)' }}
                    title={`${m.profile?.display_name || m.profile?.username || 'Invitation'} (en attente)`}
                  >
                    {m.profile?.avatar_url
                      ? <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      : m.profile?.avatar_emoji || '🧳'
                    }
                  </button>
                ))}
                {isOwner && (
                  <button onClick={() => setShowInvite(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm transition active:scale-90 text-sm"
                    title="Inviter"
                  >+</button>
                )}
              </div>
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
                      tripId={id}
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

        {/* Budget */}
        {(() => {
          const withCost = activities.filter(a => a.cost != null && a.cost > 0)
          if (withCost.length === 0) return null
          const total = withCost.reduce((sum, a) => sum + (a.cost ?? 0), 0)
          const byType = withCost.reduce<Record<string, number>>((acc, a) => {
            acc[a.activity_type] = (acc[a.activity_type] ?? 0) + (a.cost ?? 0)
            return acc
          }, {})
          const TYPE_EMOJI: Record<string, string> = { food: '🍽️', culture: '🏛️', transport: '🚌', hotel: '🏨', nature: '🌿', other: '📍' }
          const TYPE_LABEL: Record<string, string> = { food: 'Repas', culture: 'Culture', transport: 'Transport', hotel: 'Séjour', nature: 'Nature', other: 'Autre' }
          return (
            <div className="mx-5 mt-2 mb-6 rounded-3xl overflow-hidden"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(44,36,22,0.08)' }}
            >
              <div className="px-4 pt-4 pb-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid #F0E8DC' }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Budget du voyage</p>
                <p className="text-lg font-bold" style={{ color: '#2C2416' }}>
                  {total % 1 === 0 ? total : total.toFixed(2)} €
                </p>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TYPE_EMOJI[type] ?? '📍'}</span>
                      <span className="text-sm" style={{ color: '#8A7B6A' }}>{TYPE_LABEL[type] ?? type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full" style={{
                        width: `${Math.round((amount / total) * 80)}px`,
                        background: '#F5E8DF',
                        minWidth: '8px',
                      }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.round((amount / total) * 100)}%`,
                          background: '#C2714A',
                        }} />
                      </div>
                      <span className="text-sm font-semibold w-16 text-right" style={{ color: '#2C2416' }}>
                        {amount % 1 === 0 ? amount : amount.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

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

        {/* Invite member sheet */}
        {showInvite && (
          <InviteMemberSheet
            tripId={trip.id}
            onClose={() => setShowInvite(false)}
            onInvited={() => { setShowInvite(false); fetchData() }}
          />
        )}

        {/* Remove member confirmation */}
        {removeConfirm && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setRemoveConfirm(null)}>
            <div
              className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex justify-center">
                <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
              </div>
              <div className="mb-5 flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-3xl"
                  style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)' }}
                >
                  {removeConfirm.profile?.avatar_url
                    ? <img src={removeConfirm.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    : removeConfirm.profile?.avatar_emoji || '🧳'
                  }
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: '#2C2416' }}>
                    Retirer {removeConfirm.profile?.display_name || removeConfirm.profile?.username || 'ce voyageur'} ?
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#8A7B6A' }}>
                    {removeConfirm.status === 'pending'
                      ? "L'invitation sera annulée."
                      : "Il perdra l'accès à ce voyage."
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRemoveConfirm(null)}
                  className="flex-1 rounded-2xl py-3 text-sm font-semibold"
                  style={{ background: '#F7F2EA', color: '#8A7B6A' }}
                >
                  Annuler
                </button>
                <button
                  onClick={async () => { await removeMember(removeConfirm.user_id); setRemoveConfirm(null) }}
                  className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white"
                  style={{ background: '#D9603B' }}
                >
                  {removeConfirm.status === 'pending' ? 'Annuler l\'invitation' : 'Retirer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageFade>
  )
}
