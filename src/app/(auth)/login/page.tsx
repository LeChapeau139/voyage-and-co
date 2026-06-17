'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false) }
    else router.push('/voyages')
  }

  const inputClass = "w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition placeholder:text-[#B5A89A] focus:ring-2"

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416', '--tw-ring-color': '#C2714A40' } as React.CSSProperties}
        />
        <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required
          className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416' } as React.CSSProperties}
        />
      </div>

      {error && <p className="text-sm" style={{ color: '#C2714A' }}>{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
        style={{ background: loading ? '#B5A89A' : '#C2714A' }}
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>

      <p className="text-center text-sm" style={{ color: '#8A7B6A' }}>
        Pas encore de compte ?{' '}
        <Link href="/signup" className="font-semibold" style={{ color: '#C2714A' }}>S&apos;inscrire</Link>
      </p>
    </form>
  )
}
