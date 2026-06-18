'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import type { Profile } from '@/lib/types'
import PageFade from '@/components/PageFade'
import FollowListSheet from '@/components/FollowListSheet'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

const AVATAR_EMOJIS = ['🧳', '✈️', '🌍', '🗺️', '🏔️', '🌊', '🏖️', '🎒', '🌴', '🏕️', '🚂', '⛵']

interface Stats {
  trips: number
  memories: number
  places: number
  countries: number
}

export default function ProfilPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [stats, setStats] = useState<Stats>({ trips: 0, memories: 0, places: 0, countries: 0 })
  const [visitedCountries, setVisitedCountries] = useState<string[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followerIds, setFollowerIds] = useState<string[]>([])
  const [following, setFollowing] = useState<(Profile & { follow_id: string })[]>([])
  const [followSheet, setFollowSheet] = useState<'followers' | 'following' | null>(null)

  // Edit form state
  const [editUsername, setEditUsername] = useState('')
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editAvatarEmoji, setEditAvatarEmoji] = useState('🧳')
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null)
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    async function fetchAll() {
      const [tripsRes, memoriesRes, placesRes, destinationsRes, profileRes, followersRes, followingRes] = await Promise.all([
        supabase.from('trips').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('entry_type', 'memory').eq('user_id', user!.id),
        supabase.from('places').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('trips').select('destination').eq('user_id', user!.id).not('destination', 'is', null),
        supabase.from('profiles').select('*').eq('id', user!.id).single(),
        supabase.from('follows').select('id, follower_id').eq('following_id', user!.id),
        supabase.from('follows').select('id, following_id').eq('follower_id', user!.id),
      ])
      const countryNames = [
        ...new Set(
          (destinationsRes.data ?? [])
            .map(t => t.destination?.split(',').pop()?.trim())
            .filter((c): c is string => Boolean(c))
        ),
      ]
      setVisitedCountries(countryNames)
      setStats({
        trips: tripsRes.count ?? 0,
        memories: memoriesRes.count ?? 0,
        places: placesRes.count ?? 0,
        countries: countryNames.length,
      })
      if (profileRes.data) setProfile(profileRes.data)
      const fIds = (followersRes.data ?? []).map(f => f.follower_id)
      setFollowersCount(fIds.length)
      setFollowerIds(fIds)

      // Fetch profiles of people we follow
      const followingIds = (followingRes.data ?? []).map(f => f.following_id)
      if (followingIds.length > 0) {
        const { data: followingProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followingIds)
        const withFollowId = (followingProfiles ?? []).map(p => ({
          ...p,
          follow_id: (followingRes.data ?? []).find(f => f.following_id === p.id)?.id ?? '',
        }))
        setFollowing(withFollowId)
      }
    }
    fetchAll()
  }, [user])

  const openEdit = () => {
    setEditUsername(profile?.username ?? '')
    setEditDisplayName(profile?.display_name ?? '')
    setEditAvatarEmoji(profile?.avatar_emoji ?? '🧳')
    setEditAvatarUrl(profile?.avatar_url ?? null)
    setEditAvatarPreview(profile?.avatar_url ?? null)
    setEditBio(profile?.bio ?? '')
    setUsernameError('')
    setEditingProfile(true)
  }

  const handleAvatarPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditAvatarPreview(URL.createObjectURL(file))
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-activity-photo', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setEditAvatarUrl(data.url)
    else toast.error('Échec du téléversement')
    setUploadingPhoto(false)
    e.target.value = ''
  }

  const saveProfile = async () => {
    if (!user) return
    const username = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!username) { setUsernameError('Le pseudo est obligatoire'); return }
    if (username.length < 3) { setUsernameError('Minimum 3 caractères'); return }

    setSaving(true)
    setUsernameError('')

    // Check uniqueness (excluding current user)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()

    if (existing) {
      setUsernameError('Ce pseudo est déjà pris')
      setSaving(false)
      return
    }

    const payload = {
      id: user.id,
      username,
      display_name: editDisplayName.trim() || null,
      avatar_emoji: editAvatarEmoji,
      avatar_url: editAvatarUrl,
      bio: editBio.trim() || null,
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') setUsernameError('Ce pseudo est déjà pris')
      else toast.error('Erreur lors de la sauvegarde')
    } else {
      setProfile(data)
      setEditingProfile(false)
      toast.success('Profil mis à jour ✅')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const inputClass = "w-full rounded-2xl border px-4 py-3.5 text-sm outline-none placeholder:text-[#B5A89A]"
  const inputStyle = { borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }

  return (
    <PageFade>
      <div className="min-h-screen px-5 pt-10 pb-28" style={{ background: '#FAF8F5' }}>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Mon compte</p>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Profil</h1>
        </div>

        {/* Avatar + identité */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-4xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', boxShadow: '0 8px 24px rgba(194,113,74,0.2)' }}
          >
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              : profile?.avatar_emoji ?? '🧳'
            }
          </div>

          {profile?.display_name && (
            <p className="text-lg font-bold" style={{ color: '#2C2416' }}>{profile.display_name}</p>
          )}
          {profile?.username ? (
            <p className="text-sm font-medium" style={{ color: '#C2714A' }}>@{profile.username}</p>
          ) : (
            <button
              onClick={openEdit}
              className="rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ background: '#F5E8DF', color: '#C2714A', border: '1.5px dashed #C2714A' }}
            >
              + Choisir un pseudo
            </button>
          )}
          <p className="text-xs" style={{ color: '#B5A89A' }}>{user?.email}</p>

          {profile?.bio && (
            <p className="text-center text-sm leading-relaxed" style={{ color: '#8A7B6A', maxWidth: '260px' }}>
              {profile.bio}
            </p>
          )}

          {/* Followers / Following counts */}
          <div className="mt-2 flex items-center gap-5">
            <button onClick={() => setFollowSheet('followers')} className="text-center transition active:scale-95">
              <p className="text-base font-bold" style={{ color: '#2C2416' }}>{followersCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#B5A89A' }}>Abonnés</p>
            </button>
            <div className="h-6 w-px" style={{ background: '#E8DFD0' }} />
            <button onClick={() => setFollowSheet('following')} className="text-center transition active:scale-95">
              <p className="text-base font-bold" style={{ color: '#2C2416' }}>{following.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#B5A89A' }}>Abonnements</p>
            </button>
          </div>

          <button
            onClick={openEdit}
            className="mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95"
            style={{ background: '#F7F2EA', color: '#8A7B6A' }}
          >
            ✏️ Modifier le profil
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          {[
            { value: stats.trips,     label: 'Voyages',   emoji: '✈️' },
            { value: stats.memories,  label: 'Souvenirs', emoji: '📸' },
            { value: stats.places,    label: 'Lieux',     emoji: '📍' },
            { value: stats.countries, label: 'Pays',      emoji: '🌍' },
          ].map(s => (
            <div key={s.label}
              className="flex flex-col items-center gap-1 rounded-2xl py-3 shadow-sm"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(44,36,22,0.06)' }}
            >
              <span className="text-lg">{s.emoji}</span>
              <span className="text-xl font-bold" style={{ color: '#2C2416' }}>{s.value}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#B5A89A' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Abonnements */}
        {following.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 px-5 text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>
              Mes abonnements
            </p>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
              {following.map(p => (
                <Link key={p.id} href={`/explorer/${p.id}`}>
                  <div className="flex flex-shrink-0 flex-col items-center gap-1.5 transition active:scale-95">
                    <div
                      className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-2xl shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', border: '2px solid #E8DFD0' }}
                    >
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        : p.avatar_emoji || '🧳'
                      }
                    </div>
                    <p className="max-w-[56px] truncate text-center text-[10px] font-semibold" style={{ color: '#2C2416' }}>
                      {p.display_name || p.username || '?'}
                    </p>
                    {p.username && (
                      <p className="max-w-[56px] truncate text-center text-[9px]" style={{ color: '#B5A89A' }}>
                        @{p.username}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* World Map */}
        <div className="mb-6 overflow-hidden rounded-3xl shadow-sm" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(44,36,22,0.08)' }}>
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Mes destinations</p>
              <p className="text-sm font-bold" style={{ color: '#2C2416' }}>
                {visitedCountries.length === 0
                  ? 'Aucun pays encore'
                  : `${visitedCountries.length} pays visité${visitedCountries.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <span className="text-2xl">🌍</span>
          </div>
          <WorldMap visitedCountryNames={visitedCountries} />
          {visitedCountries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {visitedCountries.map(c => (
                <span key={c} className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: '#C2714A' }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleLogout}
          className="w-full rounded-2xl px-5 py-4 text-center font-semibold transition active:scale-[0.98]"
          style={{ background: '#FEF2F2', color: '#DC5E4A', border: '1px solid #FECACA' }}
        >
          Se déconnecter
        </button>
      </div>

      {followSheet && (
        <FollowListSheet
          title={followSheet === 'followers' ? `${followersCount} abonné${followersCount > 1 ? 's' : ''}` : `${following.length} abonnement${following.length > 1 ? 's' : ''}`}
          userIds={followSheet === 'followers' ? followerIds : following.map(f => f.id)}
          onClose={() => setFollowSheet(null)}
        />
      )}

      {/* Edit profile sheet */}
      {editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingProfile(false)}>
          <div
            className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
            </div>
            <h2 className="mb-4 text-base font-bold" style={{ color: '#2C2416' }}>Modifier le profil</h2>

            {/* Avatar photo + emoji picker */}
            <div className="mb-4 flex items-start gap-4">
              {/* Photo circle */}
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', border: '2.5px dashed #C2714A' }}
              >
                {editAvatarPreview ? (
                  <img src={editAvatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">{editAvatarEmoji}</span>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#C2714A] text-white text-xs">
                  📷
                </div>
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPhoto} />

              {/* Emoji picker */}
              <div className="flex flex-wrap gap-1.5 flex-1">
                {AVATAR_EMOJIS.map(emoji => (
                  <button key={emoji} type="button"
                    onClick={() => { setEditAvatarEmoji(emoji); setEditAvatarPreview(null); setEditAvatarUrl(null) }}
                    className="h-9 w-9 rounded-xl text-xl transition"
                    style={{
                      background: !editAvatarPreview && editAvatarEmoji === emoji ? '#F5E8DF' : '#F7F2EA',
                      border: `1.5px solid ${!editAvatarPreview && editAvatarEmoji === emoji ? '#C2714A' : 'transparent'}`,
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: '#8A7B6A' }}>
                  @Pseudo <span style={{ color: '#DC5E4A' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="ton_pseudo"
                  value={editUsername}
                  onChange={e => { setEditUsername(e.target.value); setUsernameError('') }}
                  className={inputClass}
                  style={{ ...inputStyle, borderColor: usernameError ? '#DC5E4A' : '#E8DFD0' }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
                {usernameError && <p className="mt-1 text-xs" style={{ color: '#DC5E4A' }}>{usernameError}</p>}
                <p className="mt-1 text-xs" style={{ color: '#B5A89A' }}>Lettres, chiffres et _ uniquement • min. 3 caractères</p>
              </div>

              {/* Display name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: '#8A7B6A' }}>Nom affiché</label>
                <input
                  type="text"
                  placeholder="Ton prénom ou surnom"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: '#8A7B6A' }}>Bio</label>
                <textarea
                  placeholder="Quelques mots sur toi..."
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingProfile(false)}
                  className="flex-1 rounded-2xl py-3.5 text-sm font-semibold transition active:scale-95"
                  style={{ background: '#F7F2EA', color: '#8A7B6A' }}
                >
                  Annuler
                </button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                  style={{ background: '#C2714A' }}
                >
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFade>
  )
}
