'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ActivityType } from '@/lib/types'
import AddNearbySheet from './AddNearbySheet'

export interface NearbyPlace {
  fsq_id: string
  name: string
  categories: { id: string; name: string; categoryCode: number; icon: { prefix: string; suffix: string } }[]
  location: {
    address?: string
    locality?: string
    formatted_address?: string
  }
  distance: number
}

const FILTERS = [
  { key: 'all',     label: 'Tous',    emoji: '🗺️' },
  { key: 'food',    label: 'Restos',  emoji: '🍽️' },
  { key: 'cafe',    label: 'Cafés',   emoji: '☕' },
  { key: 'culture', label: 'Culture', emoji: '🏛️' },
  { key: 'nature',  label: 'Nature',  emoji: '🌿' },
  { key: 'hotel',   label: 'Hôtels', emoji: '🏨' },
]

type Permission = 'unknown' | 'requesting' | 'denied' | 'granted'

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

function getActivityType(categories: { categoryCode: number }[]): ActivityType {
  const code = categories[0]?.categoryCode ?? 0
  if (code >= 13000 && code < 14000) return 'food'
  if (code >= 10000 && code < 11000) return 'culture'
  if (code >= 16000 && code < 17000) return 'nature'
  if (code >= 19000 && code < 20000) return 'hotel'
  return 'other'
}

const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  food: '🍽️', culture: '🏛️', transport: '🚌', hotel: '🏨', nature: '🌿', other: '📍',
}
const BG_COLOR: Record<ActivityType, string> = {
  food: '#FEF3C7', culture: '#E8F0E9', transport: '#E8EFF7',
  hotel: '#F3E8F5', nature: '#DCEEDE', other: '#F7F2EA',
}

function PlaceCard({ place, onSelect }: { place: NearbyPlace; onSelect: (p: NearbyPlace) => void }) {
  const activityType = getActivityType(place.categories)
  const categoryName = place.categories[0]?.name ?? 'Lieu'

  return (
    <button
      onClick={() => onSelect(place)}
      className="flex items-center gap-3.5 rounded-2xl bg-white p-3.5 text-left transition active:scale-[0.97]"
      style={{ boxShadow: '0 2px 12px rgba(44,36,22,0.08)' }}
    >
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{ background: BG_COLOR[activityType] }}
      >
        {ACTIVITY_EMOJI[activityType]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm" style={{ color: '#2C2416' }}>{place.name}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: '#B5A89A' }}>{categoryName}</p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: '#F5E8DF', color: '#C2714A' }}
        >
          {formatDistance(place.distance)}
        </span>
        {place.location.address && (
          <p className="max-w-[90px] truncate text-right text-[9px]" style={{ color: '#B5A89A' }}>
            {place.location.address}
          </p>
        )}
        {!place.location.address && place.location.locality && (
          <p className="text-[9px]" style={{ color: '#B5A89A' }}>{place.location.locality}</p>
        )}
      </div>
    </button>
  )
}

export default function AutourDeMoiPage() {
  const [permission, setPermission] = useState<Permission>('unknown')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaces = useCallback(async (lat: number, lng: number, filter: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&filter=${filter}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlaces(data.results ?? [])
    } catch {
      setError('Impossible de charger les lieux.')
    } finally {
      setLoading(false)
    }
  }, [])

  const requestLocation = () => {
    setPermission('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPosition(coords)
        setPermission('granted')
        fetchPlaces(coords.lat, coords.lng, 'all')
      },
      () => setPermission('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  useEffect(() => {
    if (position) fetchPlaces(position.lat, position.lng, activeFilter)
  }, [activeFilter, position, fetchPlaces])

  return (
    <div className="flex min-h-screen flex-col px-5 pt-10">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Explorer</p>
        <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Autour de moi</h1>
      </div>

      {permission === 'unknown' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center pb-24">
          <div className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
            style={{ background: 'linear-gradient(135deg, #F5E8DF, #EDD9C8)', boxShadow: '0 8px 32px rgba(194,113,74,0.2)' }}
          >
            🗺️
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: '#2C2416' }}>Découvre les alentours</p>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed" style={{ color: '#8A7B6A' }}>
              Restaurants, musées, parcs — tout ce qu'il y a près de toi.
            </p>
          </div>
          <button onClick={requestLocation}
            className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition active:scale-95"
            style={{ background: '#C2714A', boxShadow: '0 4px 20px rgba(194,113,74,0.4)' }}
          >
            📍 Activer la géolocalisation
          </button>
        </div>
      )}

      {permission === 'requesting' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center pb-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: '#F5E8DF', borderTopColor: '#C2714A' }}
          />
          <p className="font-semibold" style={{ color: '#2C2416' }}>Localisation en cours...</p>
          <p className="text-sm" style={{ color: '#8A7B6A' }}>Autorise l'accès à ta position</p>
        </div>
      )}

      {permission === 'denied' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center pb-24">
          <div className="text-5xl">🔒</div>
          <p className="font-bold" style={{ color: '#2C2416' }}>Accès refusé</p>
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: '#8A7B6A' }}>
            Autorise l'accès à ta position dans les réglages de ton navigateur, puis réessaie.
          </p>
          <button onClick={requestLocation}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white transition active:scale-95"
            style={{ background: '#C2714A' }}
          >
            Réessayer
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <>
          {/* Filter chips */}
          <div className="mb-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition active:scale-95"
                style={{
                  background: activeFilter === f.key ? '#C2714A' : '#F7F2EA',
                  color: activeFilter === f.key ? '#FFFFFF' : '#8A7B6A',
                }}
              >
                <span>{f.emoji}</span>{f.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col gap-3 pb-24">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-3 rounded-2xl bg-white p-3.5"
                  style={{ boxShadow: '0 2px 12px rgba(44,36,22,0.08)' }}
                >
                  <div className="h-14 w-14 flex-shrink-0 animate-pulse rounded-xl" style={{ background: '#F0E8DC' }} />
                  <div className="flex-1 flex flex-col gap-2 justify-center">
                    <div className="h-3.5 w-3/4 animate-pulse rounded-full" style={{ background: '#F0E8DC' }} />
                    <div className="h-2.5 w-1/2 animate-pulse rounded-full" style={{ background: '#F5EFE8' }} />
                    <div className="h-2.5 w-1/4 animate-pulse rounded-full" style={{ background: '#F5EFE8' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="text-4xl">⚠️</p>
              <p className="font-semibold" style={{ color: '#2C2416' }}>{error}</p>
              <button onClick={() => position && fetchPlaces(position.lat, position.lng, activeFilter)}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ background: '#C2714A' }}
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && places.length === 0 && (
            <div className="mt-10 flex flex-col items-center gap-3 text-center pb-24">
              <p className="text-4xl">🔍</p>
              <p className="font-semibold" style={{ color: '#2C2416' }}>Aucun lieu trouvé</p>
              <p className="text-sm" style={{ color: '#8A7B6A' }}>Essaie un autre filtre</p>
            </div>
          )}

          {!loading && !error && places.length > 0 && (
            <>
              <p className="mb-3 text-xs font-medium" style={{ color: '#B5A89A' }}>
                {places.length} lieu{places.length > 1 ? 'x' : ''} à proximité
              </p>
              <div className="flex flex-col gap-3 pb-28">
                {places.map(place => (
                  <PlaceCard key={place.fsq_id} place={place} onSelect={setSelectedPlace} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {selectedPlace && (
        <AddNearbySheet
          place={selectedPlace}
          activityType={getActivityType(selectedPlace.categories)}
          onClose={() => setSelectedPlace(null)}
          onDone={() => setSelectedPlace(null)}
        />
      )}
    </div>
  )
}
