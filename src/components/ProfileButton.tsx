'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'

export default function ProfileButton() {
  const pathname = usePathname()
  const [avatar, setAvatar] = useState<{ url: string | null; emoji: string }>({ url: null, emoji: '🧳' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, avatar_emoji')
        .eq('id', user.id)
        .single()
      if (data) setAvatar({ url: data.avatar_url, emoji: data.avatar_emoji ?? '🧳' })
    }
    load()
  }, [pathname])

  const isActive = pathname.startsWith('/profil')

  return (
    <Link href="/profil">
      <div
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition active:scale-90"
        style={{
          background: isActive ? 'linear-gradient(135deg, #C2714A, #A85C38)' : 'linear-gradient(135deg, #F5E8DF, #EDD9C8)',
          boxShadow: isActive ? '0 4px 12px rgba(194,113,74,0.4)' : '0 2px 8px rgba(44,36,22,0.1)',
          border: isActive ? '2px solid #C2714A' : '2px solid #E8DFD0',
        }}
      >
        {avatar.url ? (
          <img src={avatar.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg leading-none">{avatar.emoji}</span>
        )}
      </div>
    </Link>
  )
}
