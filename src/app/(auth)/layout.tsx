export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5"
      style={{ background: 'linear-gradient(160deg, #F7F0E6 0%, #EDE4D5 50%, #E5D9C6 100%)' }}
    >
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">✈️</div>
        <h1 className="text-3xl font-bold" style={{ color: '#2C2416' }}>Voyage & Co</h1>
        <p className="mt-1 text-sm" style={{ color: '#8A7B6A' }}>Ton compagnon de voyage</p>
      </div>
      <div className="w-full max-w-sm rounded-3xl bg-white/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm ring-1 ring-white">
        {children}
      </div>
    </div>
  )
}
