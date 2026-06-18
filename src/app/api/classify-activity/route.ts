import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES = ['food', 'culture', 'nature', 'hotel', 'transport', 'other'] as const

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ type: 'other' })

  const body = {
    contents: [{
      parts: [
        {
          text: `Look at this photo and classify the activity shown. Reply with exactly one word from: food, culture, nature, hotel, transport, other.
- food: restaurant, meal, drink, market, café
- culture: museum, monument, historic site, art, temple, church, palace
- nature: landscape, park, beach, mountain, forest, lake, waterfall
- hotel: accommodation, room, lobby, pool, resort
- transport: airplane, train, bus, car, airport, station, road, boat
- other: anything else
Reply with only the single word, lowercase.`,
        },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ],
    }],
    generationConfig: { maxOutputTokens: 10, temperature: 0 },
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() ?? 'other'
    const type = VALID_TYPES.find(t => raw.includes(t)) ?? 'other'
    return NextResponse.json({ type })
  } catch {
    return NextResponse.json({ type: 'other' })
  }
}
