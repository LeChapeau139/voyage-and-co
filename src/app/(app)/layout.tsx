import BottomNav from '@/components/BottomNav'
import { CreateActionProvider } from '@/contexts/CreateActionContext'
import { ToastProvider } from '@/contexts/ToastContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CreateActionProvider>
        <div className="flex min-h-screen flex-col" style={{ background: '#FAFAF7' }}>
          <main className="flex-1 pb-28">{children}</main>
          <BottomNav />
        </div>
      </CreateActionProvider>
    </ToastProvider>
  )
}
