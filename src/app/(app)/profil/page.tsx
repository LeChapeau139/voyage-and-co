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

  return (
    <div className="px-4 pt-12">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">Profil</h1>

      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl">
          👤
        </div>
        <p className="font-semibold text-zinc-900">{user?.email?.split('@')[0]}</p>
        <p className="text-sm text-zinc-500">{user?.email}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Membre depuis {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : ''}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-1 ring-zinc-100">
          <span className="text-xl">🔔</span>
          <span className="flex-1 font-medium text-zinc-800">Notifications</span>
          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={handleLogout}
          className="mt-4 w-full rounded-2xl bg-red-50 px-5 py-4 text-center font-medium text-red-600 ring-1 ring-red-100"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
