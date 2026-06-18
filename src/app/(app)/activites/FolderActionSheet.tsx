'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlaceFolder } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'

const EMOJIS = ['📁', '🗺️', '🍽️', '🏛️', '🌿', '🏨', '⭐', '❤️', '🔥', '🎭', '🏔️', '🌊']

interface Props {
  folder: PlaceFolder
  itemCount: number
  onClose: () => void
  onRenamed: (updated: PlaceFolder) => void
  onDeleted: (folderId: string) => void
}

type Screen = 'actions' | 'rename' | 'confirm-delete'

export default function FolderActionSheet({ folder, itemCount, onClose, onRenamed, onDeleted }: Props) {
  const { toast } = useToast()
  const [screen, setScreen] = useState<Screen>('actions')
  const [newName, setNewName] = useState(folder.name)
  const [newEmoji, setNewEmoji] = useState(folder.emoji)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleRename = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('place_folders')
      .update({ name: newName.trim(), emoji: newEmoji })
      .eq('id', folder.id)
      .select()
      .single()
    if (data) {
      toast.success('Dossier modifié')
      onRenamed(data)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('place_folders').delete().eq('id', folder.id)
    toast.success(`"${folder.name}" supprimé`)
    onDeleted(folder.id)
  }

  const sheetClass = "animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
  const handle = <div className="mb-5 flex justify-center"><div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} /></div>

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className={sheetClass} onClick={e => e.stopPropagation()}>
        {handle}

        {/* Folder recap */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl p-3" style={{ background: '#F5E8DF' }}>
          <span className="text-2xl">{folder.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold" style={{ color: '#2C2416' }}>{folder.name}</p>
            <p className="text-xs" style={{ color: '#B5A89A' }}>
              {itemCount > 0 ? `${itemCount} élément${itemCount > 1 ? 's' : ''}` : 'Vide'}
            </p>
          </div>
        </div>

        {screen === 'actions' && (
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setScreen('rename')}
              className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
              style={{ background: '#F7F2EA', border: '1.5px solid #E8DFD0' }}
            >
              <span className="text-2xl">✏️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Renommer</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>Changer le nom ou l'emoji</p>
              </div>
            </button>

            <button onClick={() => setScreen('confirm-delete')}
              className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
              style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}
            >
              <span className="text-2xl">🗑️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#DC5E4A' }}>Supprimer le dossier</p>
                <p className="text-xs mt-0.5" style={{ color: '#B5A89A' }}>
                  {itemCount > 0 ? 'Les lieux seront déplacés hors des dossiers' : 'Le dossier est vide'}
                </p>
              </div>
            </button>
          </div>
        )}

        {screen === 'rename' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setNewEmoji(e)}
                  className="h-10 w-10 rounded-xl text-xl transition"
                  style={{ background: newEmoji === e ? '#F5E8DF' : '#F7F2EA', border: `1.5px solid ${newEmoji === e ? '#C2714A' : 'transparent'}` }}
                >
                  {e}
                </button>
              ))}
            </div>
            <input autoFocus type="text" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none"
              style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setScreen('actions')}
                className="flex-1 rounded-2xl py-3.5 text-sm font-semibold transition active:scale-95"
                style={{ background: '#F7F2EA', color: '#8A7B6A' }}
              >
                Annuler
              </button>
              <button onClick={handleRename} disabled={!newName.trim() || saving}
                className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                style={{ background: '#C2714A' }}
              >
                {saving ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {screen === 'confirm-delete' && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm" style={{ color: '#8A7B6A' }}>
              Supprimer <span className="font-semibold" style={{ color: '#2C2416' }}>{folder.emoji} {folder.name}</span> ?
              {itemCount > 0 && (
                <span className="mt-1 block text-xs" style={{ color: '#B5A89A' }}>
                  Les {itemCount} élément{itemCount > 1 ? 's' : ''} seront déplacés hors des dossiers.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setScreen('actions')}
                className="flex-1 rounded-2xl py-3.5 text-sm font-semibold transition active:scale-95"
                style={{ background: '#F7F2EA', color: '#8A7B6A' }}
              >
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                style={{ background: '#DC5E4A' }}
              >
                {deleting ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
