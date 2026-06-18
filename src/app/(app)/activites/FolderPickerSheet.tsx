'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlaceFolder } from '@/lib/types'

const EMOJIS = ['📁', '🗺️', '🍽️', '🏛️', '🌿', '🏨', '⭐', '❤️', '🔥', '🎭', '🏔️', '🌊']

interface Props {
  onSelect: (folderId: string | null, folderLabel: string) => void
  onClose: () => void
}

export default function FolderPickerSheet({ onSelect, onClose }: Props) {
  const [folders, setFolders] = useState<PlaceFolder[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [parentForNew, setParentForNew] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📁')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('place_folders').select('*').order('created_at')
      .then(({ data }) => setFolders(data ?? []))
  }, [])

  const rootFolders = folders.filter(f => !f.parent_id)
  const subsOf = (id: string) => folders.filter(f => f.parent_id === id)

  const createFolder = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('place_folders').insert({
      user_id: user!.id,
      name: newName.trim(),
      emoji: newEmoji,
      parent_id: parentForNew,
    }).select().single()
    if (data) {
      const parentName = parentForNew ? folders.find(f => f.id === parentForNew)?.name : null
      const label = parentName ? `${parentName} › ${data.name}` : data.name
      onSelect(data.id, label)
    }
    setSaving(false)
  }

  const sheetClass = "animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
  const handle = <div className="mb-5 flex justify-center"><div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} /></div>

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={sheetClass} onClick={e => e.stopPropagation()}>
        {handle}
        {!creating ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: '#2C2416' }}>Choisir un dossier</h2>
              <button onClick={onClose} style={{ color: '#B5A89A' }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              <button onClick={() => onSelect(null, 'Sans dossier')}
                className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.98]"
                style={{ background: '#F7F2EA', border: '1.5px solid #E8DFD0' }}
              >
                <span className="text-xl">📋</span>
                <span className="font-semibold text-sm" style={{ color: '#2C2416' }}>Sans dossier</span>
              </button>

              {rootFolders.map(folder => {
                const subs = subsOf(folder.id)
                const isExpanded = expandedId === folder.id
                return (
                  <div key={folder.id}>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onSelect(folder.id, folder.name)}
                        className="flex flex-1 items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.98]"
                        style={{ background: '#F5E8DF', border: '1.5px solid #EDD9C8' }}
                      >
                        <span className="text-xl">{folder.emoji}</span>
                        <span className="flex-1 font-semibold text-sm" style={{ color: '#2C2416' }}>{folder.name}</span>
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : folder.id)}
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition"
                        style={{ background: '#F5E8DF' }}
                      >
                        <svg className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#C2714A' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ml-5 mt-1.5 flex flex-col gap-1.5">
                        {subs.map(sub => (
                          <button key={sub.id} onClick={() => onSelect(sub.id, `${folder.name} › ${sub.name}`)}
                            className="flex items-center gap-3 rounded-xl p-3 text-left transition active:scale-[0.98]"
                            style={{ background: '#F7F2EA', border: '1px solid #E8DFD0' }}
                          >
                            <span>{sub.emoji}</span>
                            <span className="text-sm font-medium" style={{ color: '#2C2416' }}>{sub.name}</span>
                          </button>
                        ))}
                        <button onClick={() => { setParentForNew(folder.id); setCreating(true) }}
                          className="flex items-center gap-2 rounded-xl p-3"
                          style={{ color: '#C2714A' }}
                        >
                          <span className="font-bold text-base">+</span>
                          <span className="text-sm font-medium">Nouveau sous-dossier</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              <button onClick={() => { setParentForNew(null); setCreating(true) }}
                className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.98]"
                style={{ border: '1.5px dashed #D6CABC', color: '#C2714A' }}
              >
                <span className="font-bold text-xl">+</span>
                <span className="font-semibold text-sm">Nouveau dossier</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button onClick={() => { setCreating(false); setNewName('') }} className="flex items-center gap-1 text-sm" style={{ color: '#8A7B6A' }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <h2 className="text-base font-bold" style={{ color: '#2C2416' }}>
                {parentForNew ? 'Nouveau sous-dossier' : 'Nouveau dossier'}
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setNewEmoji(e)}
                    className="h-10 w-10 rounded-xl text-xl transition"
                    style={{ background: newEmoji === e ? '#F5E8DF' : '#F7F2EA', border: `1.5px solid ${newEmoji === e ? '#C2714A' : 'transparent'}` }}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input autoFocus type="text" placeholder="Nom du dossier" value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createFolder()}
                className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none"
                style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
              />
              <button onClick={createFolder} disabled={!newName.trim() || saving}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
              >
                {saving ? 'Création...' : 'Créer et sélectionner'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
