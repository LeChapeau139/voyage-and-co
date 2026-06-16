import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { error } = await supabase.from('_test_connection').select('*').limit(1)

  const connected = !error || error.code === 'PGRST116' || error.message.includes('does not exist')

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-800">Voyage & Co</h1>
        <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {connected ? 'Supabase connecté ✓' : `Erreur : ${error?.message}`}
        </div>
      </div>
    </div>
  )
}
