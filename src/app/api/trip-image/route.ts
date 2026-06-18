import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? 'travel landscape'
  const key = process.env.UNSPLASH_ACCESS_KEY

  if (!key) {
    return NextResponse.json({ url: null }, { status: 200 })
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' travel landmark')}&per_page=1&orientation=portrait`,
    {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 86400 }, // cache 24h par destination
    }
  )

  if (!res.ok) {
    return NextResponse.json({ url: null })
  }

  const data = await res.json()
  const photo = data.results?.[0]
  const url = photo?.urls?.small ?? null

  return NextResponse.json({ url })
}
