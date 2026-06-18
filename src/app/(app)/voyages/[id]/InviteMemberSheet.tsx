'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, TripMember } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'

interface Props {
  tripId: string
  onClose: () => void
  onInvited: () => void
}

export default function InviteMemberSheet({ tripId, onClose, onInvited }: Props) {
  const { toast } = useToast()
  const [following, setFollowing] = useState<Profile[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [followsRes, membersRes] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('trip_members').select('*').eq('trip_id', tripId),
      ])

      const followingIds = (followsRes.data ?? []).map(f => f.following_id)
      setMembers(membersRes.data ?? [])

      if (followingIds.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', followingIds)
        setFollowing(data ?? [])
      }
      setLoading(false)
    }
    fetchData()
  }, [tripId])

  const invite = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || inviting) return
    setInviting(userId)

    const { error } = await supabase.from('trip_members').insert({
      trip_id: tripId,
      user_id: userId,
      invited_by: user.id,
      status: 'pending',
    })

    if (error) {
      toast.error('Impossible d\'envoyer l\'invitation')
    } else {
      setMembers(prev => [...prev, { id: '', trip_id: tripId, user_id: userId, invited_by: user.id, status: 'pending', created_at: '' }])
      toast.success('Invitation envoyée ✉️')
      onInvited()
    }
    setInviting(null)
  }

  const getMemberStatus = (userId: string) => members.find(m => m.user_id === userId)?.status ?? null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#2C2416' }}>Inviter un voyageur</h2>
          <button onClick={onClose} style={{ color: '#B5A89A' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto flex flex-col gap-2" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-3 animate-pulse" style={{ background: '#F7F2EA' }}>
                <div className="h-12 w-12 rounded-full flex-shrink-0" style={{ background: '#E8DFD0' }} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3.5 w-28 rounded-full" style={{ background: '#E8DFD0' }} />
                  <div className="h-3 w-16 rounded-full" style={{ background: '#E8DFD0' }} />
                </div>
              </div>
            ))
          ) : following.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-4xl">👥</span>
              <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Aucun abonnement</p>
              <p className="text-xs leading-relaxed" style={{ color: '#8A7B6A' }}>
                Abonne-toi à des voyageurs via l'onglet Explorer pour pouvoir les inviter
              </p>
            </div>
          ) : (
            following.map(profile => {
              const status = getMemberStatus(profile.id)
              return (
                <div key={profile.id}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: '#FAFAF7', border: '1px solid #F0E8DC' }}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)' }}
                  >
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      : profile.avatar_emoji || '🧳'
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm" style={{ color: '#2C2416' }}>
                      {profile.display_name || profile.username || 'Voyageur'}
                    </p>
                    {profile.username && (
                      <p className="text-xs" style={{ color: '#B5A89A' }}>@{profile.username}</p>
                    )}
                  </div>

                  {status === 'accepted' ? (
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: '#E8F0E9', color: '#5A8A6A' }}>
                      Membre ✓
                    </span>
                  ) : status === 'pending' ? (
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: '#F5E8DF', color: '#C2714A' }}>
                      En attente
                    </span>
                  ) : (
                    <button
                      onClick={() => invite(profile.id)}
                      disabled={inviting === profile.id}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
                      style={{ background: '#C2714A' }}
                    >
                      {inviting === profile.id ? '...' : 'Inviter'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
