'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

interface Props {
  title: string
  userIds: string[]
  onClose: () => void
}

export default function FollowListSheet({ title, userIds, onClose }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfiles() {
      if (userIds.length === 0) { setLoading(false); return }
      const { data } = await supabase.from('profiles').select('*').in('id', userIds)
      setProfiles(data ?? [])
      setLoading(false)
    }
    fetchProfiles()
  }, [userIds])

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
          <h2 className="text-base font-bold" style={{ color: '#2C2416' }}>{title}</h2>
          <button onClick={onClose} style={{ color: '#B5A89A' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-3 animate-pulse" style={{ background: '#F7F2EA' }}>
                <div className="h-12 w-12 rounded-full flex-shrink-0" style={{ background: '#E8DFD0' }} />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3.5 w-28 rounded-full" style={{ background: '#E8DFD0' }} />
                  <div className="h-3 w-16 rounded-full" style={{ background: '#E8DFD0' }} />
                </div>
              </div>
            ))
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-4xl">👤</span>
              <p className="text-sm font-medium" style={{ color: '#8A7B6A' }}>Aucun résultat</p>
            </div>
          ) : (
            profiles.map(profile => (
              <Link key={profile.id} href={`/explorer/${profile.id}`} onClick={onClose}>
                <div
                  className="flex items-center gap-3 rounded-2xl p-3 transition active:scale-[0.98]"
                  style={{ background: '#FAFAF7', border: '1px solid #F0E8DC' }}
                >
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl shadow-sm"
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
                    {profile.bio && (
                      <p className="mt-0.5 truncate text-xs" style={{ color: '#8A7B6A' }}>{profile.bio}</p>
                    )}
                  </div>
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#B5A89A' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
