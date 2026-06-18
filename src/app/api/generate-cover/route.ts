import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { tripId, destination } = await req.json()

  if (!tripId || !destination) {
    return NextResponse.json({ error: 'Missing tripId or destination' }, { status: 400 })
  }

  const prompt = `Watercolor and ink hand-drawn cartoon illustration of ${destination}, travel poster style, vibrant muted colors, visible pencil sketch lines, iconic landmark, painterly texture, no text, no labels, square composition`

  // Pollinations.ai — free, no API key required
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=flux&seed=${Date.now()}`

  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) {
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }

  const imgBuffer = await imgRes.arrayBuffer()
  const filePath = `${tripId}.png`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('trip-covers')
    .upload(filePath, imgBuffer, { contentType: 'image/png', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('trip-covers')
    .getPublicUrl(filePath)

  await supabaseAdmin
    .from('trips')
    .update({ cover_url: publicUrl })
    .eq('id', tripId)

  return NextResponse.json({ url: publicUrl })
}
