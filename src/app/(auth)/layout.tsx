export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">✈️</div>
        <h1 className="text-2xl font-bold text-zinc-900">Voyage & Co</h1>
        <p className="text-sm text-zinc-500">Ton compagnon de voyage</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
