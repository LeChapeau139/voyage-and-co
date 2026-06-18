'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Trip, TravelStyle } from '@/lib/types'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

const STYLE_CONFIG: Record<TravelStyle, { emoji: string; label: string }> = {
  solo:    { emoji: '🧳', label: 'Solo' },
  couple:  { emoji: '💑', label: 'Couple' },
  friends: { emoji: '👥', label: 'Amis' },
  family:  { emoji: '👨‍👩‍👧', label: 'Famille' },
}
import CreateTripModal from './CreateTripModal'
import { useCreateAction } from '@/contexts/CreateActionContext'
import { useToast } from '@/contexts/ToastContext'
import PageFade from '@/components/PageFade'

function TripCard({ trip, onActivate }: { trip: Trip; onActivate: (id: string) => void }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(trip.cover_url)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll until cover_url is generated (background job)
  useEffect(() => {
    setCoverUrl(trip.cover_url)
    if (!trip.cover_url && trip.destination) {
      pollingRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('trips')
          .select('cover_url')
          .eq('id', trip.id)
          .single()
        if (data?.cover_url) {
          setCoverUrl(data.cover_url)
          clearInterval(pollingRef.current!)
        }
      }, 4000)
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [trip.id, trip.cover_url, trip.destination])

  return (
    <Link
      href={`/voyages/${trip.id}`}
      className="relative block overflow-hidden rounded-xl transition active:scale-[0.94]"
      style={{
        aspectRatio: '3/4',
        boxShadow: trip.is_active
          ? '0 4px 16px rgba(194,113,74,0.45)'
          : '0 2px 8px rgba(44,36,22,0.13)',
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={trip.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        /* Skeleton pendant la génération */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #F5E8DF, #E8D5C0)' }}
        >
          <div className="text-xl">🎨</div>
          <div className="h-1 w-8 animate-pulse rounded-full" style={{ background: '#C2714A', opacity: 0.4 }} />
        </div>
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, transparent 30%, rgba(15,8,0,0.72) 100%)' }}
      />

      {/* Active ring */}
      {trip.is_active && (
        <div className="absolute inset-0 rounded-xl ring-[2.5px] ring-[#C2714A]" />
      )}

      {/* Badge */}
      <div className="absolute left-1.5 top-1.5">
        {trip.is_active ? (
          <span className="rounded-full bg-[#C2714A] px-1.5 py-0.5 text-[8px] font-bold text-white shadow">
            ✈️
          </span>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); onActivate(trip.id) }}
            className="rounded-full bg-black/35 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur-sm transition active:scale-95"
          >
            Activer
          </button>
        )}
      </div>

      {/* Texte */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
        {trip.destination && (
          <p className="truncate text-[8px] font-semibold uppercase tracking-wider text-white/55">
            {trip.destination.split(',')[0]}
          </p>
        )}
        <p className="truncate text-[10px] font-bold leading-tight text-white">
          {trip.name}
        </p>
        {trip.travel_style && STYLE_CONFIG[trip.travel_style] && (
          <p className="mt-0.5 text-[8px] text-white/50">
            {STYLE_CONFIG[trip.travel_style].emoji} {STYLE_CONFIG[trip.travel_style].label}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function VoyagesPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { setAction } = useCreateAction()
  const { toast } = useToast()

  const fetchTrips = useCallback(async () => {
    const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
    setTrips(data ?? [])
    setLoading(false)
  }, [])

  const { refreshing } = usePullToRefresh(fetchTrips)

  useEffect(() => { fetchTrips() }, [fetchTrips])

  useEffect(() => {
    setAction(() => setShowModal(true))
    return () => setAction(null)
  }, [setAction])

  const setActive = async (tripId: string) => {
    await supabase.from('trips').update({ is_active: false }).neq('id', tripId)
    await supabase.from('trips').update({ is_active: true }).eq('id', tripId)
    toast.success('Voyage activé ✈️')
    fetchTrips()
  }

  return (
    <PageFade><div className="px-4 pt-14">
      {refreshing && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F5E8DF] border-t-[#C2714A]" />
        </div>
      )}

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Mes aventures</p>
        <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Voyages</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-xl" style={{ aspectRatio: '3/4', background: '#F0E8DC' }} />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-center text-sm font-medium" style={{ color: '#B5A89A' }}>Par où commencer ?</p>
          {[
            { step: '1', emoji: '✈️', title: 'Crée un voyage', desc: 'Donne un nom à ta prochaine aventure' },
            { step: '2', emoji: '📸', title: 'Documente tes souvenirs', desc: 'Ajoute des photos et des notes au fil du voyage' },
            { step: '3', emoji: '🌍', title: 'Explore autour de toi', desc: 'Trouve des lieux proches à ajouter à ton parcours' },
          ].map(item => (
            <div key={item.step}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(44,36,22,0.07)' }}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: '#C2714A' }}
              >{item.step}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>
                  {item.emoji} {item.title}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: '#8A7B6A' }}>{item.desc}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg"
            style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
          >
            ✈️ Créer mon premier voyage
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onActivate={setActive} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateTripModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchTrips() }}
        />
      )}
    </div></PageFade>
  )
}
