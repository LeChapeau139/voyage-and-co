'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Profile, Trip, TravelStyle } from '@/lib/types'
import PageFade from '@/components/PageFade'
import FollowListSheet from '@/components/FollowListSheet'

const STYLE_CONFIG: Record<TravelStyle, { emoji: string; label: string }> = {
  solo:    { emoji: '🧳', label: 'Solo' },
  couple:  { emoji: '💑', label: 'Couple' },
  friends: { emoji: '👥', label: 'Amis' },
  family:  { emoji: '👨‍👩‍👧', label: 'Famille' },
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followerIds, setFollowerIds] = useState<string[]>([])
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [followingCount, setFollowingCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followSheet, setFollowSheet] = useState<'followers' | 'following' | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const [profileRes, tripsRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('trips').select('*').eq('user_id', userId).eq('is_public', true).order('created_at', { ascending: false }),
        supabase.from('follows').select('id, follower_id').eq('following_id', userId),
        supabase.from('follows').select('id, following_id').eq('follower_id', userId),
        user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle() : Promise.resolve({ data: null }),
      ])

      setProfile(profileRes.data)
      setTrips(tripsRes.data ?? [])
      const fIds = (followersRes.data ?? []).map(f => f.follower_id)
      const fgIds = (followingRes.data ?? []).map(f => f.following_id)
      setFollowerIds(fIds)
      setFollowingIds(fgIds)
      setFollowersCount(fIds.length)
      setFollowingCount(fgIds.length)
      setIsFollowing(!!isFollowingRes.data)
      setLoading(false)
    }
    fetchData()
  }, [userId])

  const toggleFollow = async () => {
    if (!currentUserId || followLoading) return
    setFollowLoading(true)

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId)
      setIsFollowing(false)
      setFollowersCount(c => c - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId })
      setIsFollowing(true)
      setFollowersCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  const countries = [
    ...new Set(trips.map(t => t.destination?.split(',').pop()?.trim()).filter((c): c is string => Boolean(c))),
  ]

  const isOwnProfile = currentUserId === userId

  if (loading) {
    return (
      <div className="px-5 pt-14">
        <div className="h-6 w-24 animate-pulse rounded-xl mb-6" style={{ background: '#F0E8DC' }} />
        <div className="flex flex-col items-center gap-3 mt-8">
          <div className="h-20 w-20 animate-pulse rounded-full" style={{ background: '#F0E8DC' }} />
          <div className="h-5 w-32 animate-pulse rounded-xl" style={{ background: '#F0E8DC' }} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 pt-32 text-center">
        <span className="text-5xl">👤</span>
        <p className="font-semibold" style={{ color: '#2C2416' }}>Profil introuvable</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#C2714A' }}>← Retour</button>
      </div>
    )
  }

  return (
    <PageFade>
      <div className="min-h-screen pb-28" style={{ background: '#FAF8F5' }}>
        {/* Header */}
        <div className="flex items-center px-5 pt-12 pb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#8A7B6A' }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Explorer
          </button>
        </div>

        {/* Avatar + infos */}
        <div className="flex flex-col items-center gap-2 px-5 pb-5">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-4xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', boxShadow: '0 8px 24px rgba(194,113,74,0.2)' }}
          >
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              : profile.avatar_emoji || '🧳'
            }
          </div>
          <p className="text-xl font-bold" style={{ color: '#2C2416' }}>
            {profile.display_name || profile.username || 'Voyageur'}
          </p>
          {profile.username && (
            <p className="text-sm" style={{ color: '#B5A89A' }}>@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-center text-sm leading-relaxed" style={{ color: '#8A7B6A', maxWidth: '280px' }}>
              {profile.bio}
            </p>
          )}

          {/* Followers / Following */}
          <div className="mt-1 flex items-center gap-5">
            <button onClick={() => setFollowSheet('followers')} className="text-center transition active:scale-95">
              <p className="text-base font-bold" style={{ color: '#2C2416' }}>{followersCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#B5A89A' }}>Abonnés</p>
            </button>
            <div className="h-6 w-px" style={{ background: '#E8DFD0' }} />
            <button onClick={() => setFollowSheet('following')} className="text-center transition active:scale-95">
              <p className="text-base font-bold" style={{ color: '#2C2416' }}>{followingCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#B5A89A' }}>Abonnements</p>
            </button>
          </div>

          {/* Follow button */}
          {!isOwnProfile && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className="mt-2 rounded-full px-6 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60"
              style={isFollowing
                ? { background: '#F7F2EA', color: '#8A7B6A', border: '1.5px solid #E8DFD0' }
                : { background: '#C2714A', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(194,113,74,0.3)' }
              }
            >
              {followLoading ? '...' : isFollowing ? '✓ Abonné' : '+ Suivre'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mx-5 mb-6 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-2xl py-3 shadow-sm"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(44,36,22,0.06)' }}
          >
            <span className="text-xl">✈️</span>
            <span className="text-xl font-bold" style={{ color: '#2C2416' }}>{trips.length}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#B5A89A' }}>
              Voyage{trips.length > 1 ? 's' : ''} public{trips.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl py-3 shadow-sm"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(44,36,22,0.06)' }}
          >
            <span className="text-xl">🌍</span>
            <span className="text-xl font-bold" style={{ color: '#2C2416' }}>{countries.length}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#B5A89A' }}>
              Pays visité{countries.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Trips grid */}
        <div className="px-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>
            Voyages publics
          </p>
          {trips.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-4xl">🔒</span>
              <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Aucun voyage public</p>
              <p className="text-xs" style={{ color: '#B5A89A' }}>Cet utilisateur n'a pas encore partagé de voyages</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {trips.map(trip => (
                <PublicTripCard key={trip.id} trip={trip} userId={userId} />
              ))}
            </div>
          )}
        </div>
      </div>
      {followSheet && (
        <FollowListSheet
          title={followSheet === 'followers' ? `${followersCount} abonné${followersCount > 1 ? 's' : ''}` : `${followingCount} abonnement${followingCount > 1 ? 's' : ''}`}
          userIds={followSheet === 'followers' ? followerIds : followingIds}
          onClose={() => setFollowSheet(null)}
        />
      )}
    </PageFade>
  )
}

function PublicTripCard({ trip, userId }: { trip: Trip; userId: string }) {
  return (
    <Link href={`/explorer/${userId}/trips/${trip.id}`}>
      <div
        className="relative overflow-hidden rounded-xl transition active:scale-[0.94]"
        style={{ aspectRatio: '3/4', boxShadow: '0 2px 8px rgba(44,36,22,0.13)' }}
      >
        {trip.cover_url ? (
          <img src={trip.cover_url} alt={trip.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, #F5E8DF, #E8D5C0)' }}
          >✈️</div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, transparent 30%, rgba(15,8,0,0.72) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
          {trip.destination && (
            <p className="truncate text-[8px] font-semibold uppercase tracking-wider text-white/55">
              {trip.destination.split(',')[0]}
            </p>
          )}
          <p className="truncate text-[10px] font-bold leading-tight text-white">{trip.name}</p>
          {trip.travel_style && STYLE_CONFIG[trip.travel_style] && (
            <p className="mt-0.5 text-[8px] text-white/50">
              {STYLE_CONFIG[trip.travel_style].emoji} {STYLE_CONFIG[trip.travel_style].label}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
