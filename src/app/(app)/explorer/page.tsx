'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import PageFade from '@/components/PageFade'

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Link href={`/explorer/${profile.id}`}>
      <div
        className="flex items-center gap-4 rounded-2xl p-4 transition active:scale-[0.98]"
        style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(44,36,22,0.06)' }}
      >
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl shadow-sm"
          style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)' }}
        >
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            : profile.avatar_emoji || '🧳'
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm" style={{ color: '#2C2416' }}>
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
  )
}

export default function ExplorerPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [following, setFollowing] = useState<Profile[]>([])
  const [loadingFollowing, setLoadingFollowing] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function fetchFollowing() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingFollowing(false); return }

      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const ids = (followsData ?? []).map(f => f.following_id)
      if (ids.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', ids)
        setFollowing(data ?? [])
      }
      setLoadingFollowing(false)
    }
    fetchFollowing()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); setSearched(false); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${trimmed}%`)
        .limit(20)
      setResults(data ?? [])
      setSearched(true)
      setSearching(false)
    }, 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  return (
    <PageFade>
      <div className="min-h-screen px-5 pt-14 pb-28" style={{ background: '#FAF8F5' }}>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Communauté</p>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Explorer</h1>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#B5A89A' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un @pseudo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-2xl border py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-[#B5A89A]"
            style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FFFFFF' }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-[#E8DFD0] border-t-[#C2714A]" />
          )}
        </div>

        {/* Résultats de recherche */}
        {query.trim() ? (
          <>
            {searched && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 pt-12 text-center">
                <span className="text-4xl">🔍</span>
                <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Aucun résultat pour « {query} »</p>
                <p className="text-xs" style={{ color: '#B5A89A' }}>Vérifie l'orthographe du pseudo</p>
              </div>
            )}
            {results.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold" style={{ color: '#B5A89A' }}>
                  {results.length} résultat{results.length > 1 ? 's' : ''}
                </p>
                {results.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Abonnements quand pas de recherche */
          loadingFollowing ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 rounded-2xl p-4 animate-pulse"
                  style={{ background: '#FFFFFF' }}
                >
                  <div className="h-12 w-12 rounded-full flex-shrink-0" style={{ background: '#F0E8DC' }} />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3.5 w-28 rounded-full" style={{ background: '#F0E8DC' }} />
                    <div className="h-3 w-16 rounded-full" style={{ background: '#F0E8DC' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : following.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>
                Mes abonnements
              </p>
              {following.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pt-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
                style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)' }}
              >🌍</div>
              <p className="font-bold text-base" style={{ color: '#2C2416' }}>Trouve des voyageurs</p>
              <p className="max-w-xs text-sm leading-relaxed" style={{ color: '#8A7B6A' }}>
                Recherche le pseudo d'un ami pour voir ses voyages publics et t'y abonner
              </p>
            </div>
          )
        )}
      </div>
    </PageFade>
  )
}
