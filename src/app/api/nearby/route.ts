import { NextResponse } from 'next/server'

// Foursquare v2 category IDs
const CATEGORY_MAP: Record<string, string> = {
  food:    '4d4b7105d754a06374d81259', // Restaurant
  cafe:    '63be6904847c3692a84b9bb6', // Cafe, Coffee, and Tea House
  culture: '4d4b7104d754a06370d81259', // Arts and Entertainment
  nature:  '4d4b7105d754a06377d81259', // Landmarks and Outdoors
  hotel:   '63be6904847c3692a84b9c25', // Lodging
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const filter = searchParams.get('filter') ?? 'all'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: '1500',
    limit: '20',
    v: '20240101',
    client_id: process.env.FOURSQUARE_CLIENT_ID!,
    client_secret: process.env.FOURSQUARE_CLIENT_SECRET!,
  })

  const categoryId = CATEGORY_MAP[filter]
  if (categoryId) params.set('categoryId', categoryId)

  const res = await fetch(
    `https://api.foursquare.com/v2/venues/search?${params}`,
    { next: { revalidate: 60 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Foursquare error' }, { status: res.status })
  }

  const data = await res.json()

  if (data.meta?.code !== 200) {
    return NextResponse.json({ error: data.meta?.errorDetail ?? 'API error' }, { status: 400 })
  }

  // Normalize to a consistent shape
  const venues = (data.response?.venues ?? []).map((v: FsqV2Venue) => ({
    fsq_id: v.id,
    name: v.name,
    categories: v.categories,
    location: {
      address: v.location.address,
      locality: v.location.city,
      formatted_address: v.location.formattedAddress?.join(', '),
    },
    distance: v.location.distance ?? 0,
  }))

  return NextResponse.json({ results: venues })
}

interface FsqV2Venue {
  id: string
  name: string
  categories: { id: string; name: string; categoryCode: number; icon: { prefix: string; suffix: string } }[]
  location: {
    address?: string
    city?: string
    formattedAddress?: string[]
    distance?: number
  }
}
