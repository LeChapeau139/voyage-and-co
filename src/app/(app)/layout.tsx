import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#FAFAF7' }}>
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav />
    </div>
  )
}
