'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/voyages')
  }

  const inputClass = "w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition placeholder:text-[#B5A89A] focus:ring-2"

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416' } as React.CSSProperties}
        />
        <input type="password" placeholder="Mot de passe (6 caractères min.)" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required
          className={inputClass} style={{ borderColor: '#E8DFD0', color: '#2C2416' } as React.CSSProperties}
        />
      </div>

      {error && <p className="text-sm" style={{ color: '#C2714A' }}>{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
        style={{ background: '#C2714A' }}
      >
        {loading ? 'Création...' : 'Créer un compte'}
      </button>

      <p className="text-center text-sm" style={{ color: '#8A7B6A' }}>
        Déjà un compte ?{' '}
        <Link href="/login" className="font-semibold" style={{ color: '#C2714A' }}>Se connecter</Link>
      </p>
    </form>
  )
}
