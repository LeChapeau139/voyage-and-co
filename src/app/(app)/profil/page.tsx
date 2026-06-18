'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageFade from '@/components/PageFade'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

interface Stats {
  trips: number
  memories: number
  places: number
  countries: number
}

export default function ProfilPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ trips: 0, memories: 0, places: 0, countries: 0 })
  const [visitedCountries, setVisitedCountries] = useState<string[]>([])

  useEffect(() => {
    async function fetchStats() {
      const [tripsRes, memoriesRes, placesRes, destinationsRes] = await Promise.all([
        supabase.from('trips').select('id', { count: 'exact', head: true }),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('entry_type', 'memory'),
        supabase.from('places').select('id', { count: 'exact', head: true }),
        supabase.from('trips').select('destination').not('destination', 'is', null),
      ])
      const countryNames = [
        ...new Set(
          (destinationsRes.data ?? [])
            .map(t => t.destination?.split(',').pop()?.trim())
            .filter((c): c is string => Boolean(c))
        )
      ]
      setVisitedCountries(countryNames)
      setStats({
        trips: tripsRes.count ?? 0,
        memories: memoriesRes.count ?? 0,
        places: placesRes.count ?? 0,
        countries: countryNames.length,
      })
    }
    fetchStats()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'
  const username = user?.email?.split('@')[0] ?? ''

  return (
    <PageFade>
      <div className="min-h-screen px-5 pt-14 pb-28" style={{ background: '#FAF8F5' }}>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Mon compte</p>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Profil</h1>
        </div>

        {/* Avatar */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #C2714A 0%, #A85C38 100%)', boxShadow: '0 8px 24px rgba(194,113,74,0.35)' }}
          >
            {initials}
          </div>
          <p className="text-lg font-bold" style={{ color: '#2C2416' }}>{username}</p>
          <p className="text-sm" style={{ color: '#8A7B6A' }}>{user?.email}</p>
          {user?.created_at && (
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: '#F7F2EA', color: '#B5A89A' }}>
              Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          {[
            { value: stats.trips,    label: 'Voyages',   emoji: '✈️' },
            { value: stats.memories, label: 'Souvenirs', emoji: '📸' },
            { value: stats.places,   label: 'Lieux',     emoji: '📍' },
            { value: stats.countries,label: 'Pays',      emoji: '🌍' },
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

        {/* World Map */}
        <div className="mb-6 rounded-3xl overflow-hidden shadow-sm" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(44,36,22,0.08)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
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
                <span key={c}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ background: '#C2714A' }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="mb-4 flex flex-col gap-2">
          {[
            { label: 'Notifications', emoji: '🔔' },
            { label: 'Langue',        emoji: '🌍' },
            { label: 'Confidentialité', emoji: '🔒' },
          ].map(item => (
            <button key={item.label}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(44,36,22,0.05)' }}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="flex-1 font-medium" style={{ color: '#2C2416' }}>{item.label}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#B5A89A' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <button onClick={handleLogout}
          className="w-full rounded-2xl px-5 py-4 text-center font-semibold transition active:scale-[0.98]"
          style={{ background: '#FEF2F2', color: '#DC5E4A', border: '1px solid #FECACA' }}
        >
          Se déconnecter
        </button>
      </div>
    </PageFade>
  )
}
