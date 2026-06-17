'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="px-5 pt-14">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Mon compte</p>
        <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Profil</h1>
      </div>

      {/* Avatar */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #C2714A 0%, #A85C38 100%)', boxShadow: '0 8px 24px rgba(194,113,74,0.35)' }}
        >
          {initials}
        </div>
        <p className="font-bold text-lg" style={{ color: '#2C2416' }}>{user?.email?.split('@')[0]}</p>
        <p className="text-sm" style={{ color: '#8A7B6A' }}>{user?.email}</p>
        {user?.created_at && (
          <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: '#F7F2EA', color: '#B5A89A' }}>
            Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2 mb-4">
        {[
          { label: 'Notifications', emoji: '🔔' },
          { label: 'Langue', emoji: '🌍' },
          { label: 'Confidentialité', emoji: '🔒' },
        ].map(item => (
          <button key={item.label}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left shadow-sm transition active:scale-[0.98]"
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
  )
}
