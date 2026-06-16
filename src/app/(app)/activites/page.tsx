export default function ActivitesPage() {
  const activities = [
    { time: '09:00', title: 'Petit déjeuner', type: 'food', desc: 'Café Monastiraki' },
    { time: '11:00', title: 'Acropole', type: 'culture', desc: 'Visite guidée' },
    { time: '14:00', title: 'Déjeuner', type: 'food', desc: 'Taverne locale' },
    { time: '16:30', title: 'Musée National', type: 'culture', desc: 'Antiquités grecques' },
    { time: '20:00', title: 'Dîner', type: 'food', desc: 'Plaka' },
  ]

  const typeIcon: Record<string, string> = {
    food: '🍽️', culture: '🏛️', transport: '🚌', hotel: '🏨', nature: '🌿', other: '📌',
  }

  return (
    <div className="px-4 pt-12">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Activités</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <p className="mb-6 text-sm text-zinc-500">Vacances Grèce 2026 · Aujourd'hui</p>

      <div className="relative ml-2">
        {/* Ligne verticale */}
        <div className="absolute left-[27px] top-0 h-full w-0.5 bg-zinc-100" />

        <div className="flex flex-col gap-4">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <span className="z-10 text-xs font-medium text-zinc-400 w-14 text-right pr-1">{a.time}</span>
              </div>
              <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-100 text-base">
                {typeIcon[a.type]}
              </div>
              <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
                <p className="font-semibold text-zinc-900">{a.title}</p>
                <p className="text-sm text-zinc-500">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
