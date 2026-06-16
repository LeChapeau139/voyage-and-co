export default function VoyagesPage() {
  return (
    <div className="px-4 pt-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Mes voyages</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Placeholder — sera remplacé par les vraies données Supabase */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">En cours</span>
            <span className="text-xs text-zinc-400">Juil. 2026</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Vacances Grèce 2026</h2>
          <p className="text-sm text-zinc-500">Athènes · Santorin · Mykonos</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100">
            <div className="h-1.5 w-2/5 rounded-full bg-indigo-500" />
          </div>
          <p className="mt-1 text-right text-xs text-zinc-400">4 / 10 activités</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 opacity-70">
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">Passé</span>
            <span className="text-xs text-zinc-400">Mars 2026</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Week-end Paris</h2>
          <p className="text-sm text-zinc-500">Paris · France</p>
        </div>
      </div>
    </div>
  )
}
