'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCreateAction } from '@/contexts/CreateActionContext'

const leftTabs = [
  {
    href: '/voyages',
    label: 'Voyages',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-[#8A7B6A]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/activites',
    label: 'Activités',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-[#8A7B6A]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

const rightTabs = [
  {
    href: '/explorer',
    label: 'Explorer',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-[#8A7B6A]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    href: '/autour-de-moi',
    label: 'Autour',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-[#8A7B6A]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function Tab({ href, label, icon }: { href: string; label: string; icon: (active: boolean) => React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-2.5 transition-all duration-200 ${
        active ? 'bg-[#C2714A]' : 'hover:bg-[#F7F2EA]'
      }`}
    >
      {icon(active)}
      <span className={`text-[9px] font-semibold tracking-wide ${active ? 'text-white' : 'text-[#8A7B6A]'}`}>
        {label}
      </span>
    </Link>
  )
}

export default function BottomNav() {
  const { action } = useCreateAction()

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-2 shadow-xl shadow-black/10 backdrop-blur-md ring-1 ring-black/5">
        {leftTabs.map((tab) => (
          <Tab key={tab.href} {...tab} />
        ))}

        <button
          onClick={() => action?.()}
          disabled={!action}
          className={`mx-1 flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
            action
              ? 'bg-[#C2714A] shadow-md shadow-orange-900/25 active:scale-90'
              : 'bg-[#EDE4D8] opacity-40'
          }`}
        >
          <svg
            className={`h-5 w-5 ${action ? 'text-white' : 'text-[#8A7B6A]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {rightTabs.map((tab) => (
          <Tab key={tab.href} {...tab} />
        ))}
      </div>
    </nav>
  )
}
