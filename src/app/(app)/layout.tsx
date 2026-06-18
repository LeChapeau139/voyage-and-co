import BottomNav from '@/components/BottomNav'
import ProfileButton from '@/components/ProfileButton'
import { CreateActionProvider } from '@/contexts/CreateActionContext'
import { ToastProvider } from '@/contexts/ToastContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CreateActionProvider>
        <div className="flex min-h-screen flex-col" style={{ background: '#FAFAF7' }}>
          <div className="fixed right-4 top-4 z-40">
            <ProfileButton />
          </div>
          <main className="flex-1 pb-28">{children}</main>
          <BottomNav />
        </div>
      </CreateActionProvider>
    </ToastProvider>
  )
}
