export default function ProfilPage() {
  return (
    <div className="px-4 pt-12">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">Profil</h1>

      <div className="flex flex-col items-center mb-8">
        <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl mb-3">
          👤
        </div>
        <p className="font-semibold text-zinc-900">Mon compte</p>
        <p className="text-sm text-zinc-500">utilisateur@email.com</p>
      </div>

      <div className="flex flex-col gap-2">
        {[
          { label: 'Mes voyages', icon: '🌍' },
          { label: 'Notifications', icon: '🔔' },
          { label: 'Paramètres', icon: '⚙️' },
        ].map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-100 text-left"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1 font-medium text-zinc-800">{item.label}</span>
            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}

        <button className="mt-4 w-full rounded-2xl bg-red-50 px-5 py-4 text-center font-medium text-red-600 ring-1 ring-red-100">
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
