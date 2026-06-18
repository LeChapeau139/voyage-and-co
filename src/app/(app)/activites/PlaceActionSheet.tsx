'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Place, ActivityType } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'
import AddPlaceToTripSheet from './AddPlaceToTripSheet'
import FolderPickerSheet from './FolderPickerSheet'

const TYPE_CONFIG: Record<ActivityType, { emoji: string; color: string }> = {
  food:      { emoji: '🍽️', color: '#FEF3C7' },
  culture:   { emoji: '🏛️', color: '#E8F0E9' },
  transport: { emoji: '🚌', color: '#E8EFF7' },
  hotel:     { emoji: '🏨', color: '#F3E8F5' },
  nature:    { emoji: '🌿', color: '#E8F0E9' },
  other:     { emoji: '📌', color: '#F7F2EA' },
}

interface Props {
  place: Place
  onClose: () => void
  onDone: () => void
}

type Screen = 'actions' | 'add-to-trip' | 'move-folder' | 'confirm-delete'

export default function PlaceActionSheet({ place, onClose, onDone }: Props) {
  const { toast } = useToast()
  const [screen, setScreen] = useState<Screen>('actions')
  const [deleting, setDeleting] = useState(false)

  const cfg = TYPE_CONFIG[place.activity_type] ?? TYPE_CONFIG.other

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('places').delete().eq('id', place.id)
    toast.success('Lieu supprimé')
    onDone()
  }

  const handleMove = async (folderId: string | null, folderLabel: string) => {
    await supabase.from('places').update({ folder_id: folderId }).eq('id', place.id)
    toast.success(folderId ? `Déplacé dans "${folderLabel}"` : 'Déplacé hors des dossiers')
    onDone()
  }

  if (screen === 'add-to-trip') {
    return <AddPlaceToTripSheet place={place} onClose={onClose} onDone={onDone} />
  }

  if (screen === 'move-folder') {
    return (
      <FolderPickerSheet
        onSelect={(folderId, folderLabel) => handleMove(folderId, folderLabel)}
        onClose={() => setScreen('actions')}
      />
    )
  }

  const sheetClass = "animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl"
  const handle = <div className="mb-5 flex justify-center"><div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} /></div>

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className={sheetClass} onClick={e => e.stopPropagation()}>
        {handle}

        {/* Place recap */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl p-3" style={{ background: cfg.color }}>
          <span className="text-2xl">{cfg.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold" style={{ color: '#2C2416' }}>{place.title}</p>
            {place.location_name && (
              <p className="truncate text-xs" style={{ color: '#8A7B6A' }}>📍 {place.location_name}</p>
            )}
          </div>
        </div>

        {screen === 'actions' && (
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setScreen('add-to-trip')}
              className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
              style={{ background: '#F5E8DF', border: '1.5px solid #EDD9C8' }}
            >
              <span className="text-2xl">✈️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Ajouter à un voyage</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>Planifier dans un itinéraire</p>
              </div>
            </button>

            <button onClick={() => setScreen('move-folder')}
              className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
              style={{ background: '#F7F2EA', border: '1.5px solid #E8DFD0' }}
            >
              <span className="text-2xl">📁</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>Déplacer dans un dossier</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A7B6A' }}>Changer d'emplacement</p>
              </div>
            </button>

            <button onClick={() => setScreen('confirm-delete')}
              className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
              style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}
            >
              <span className="text-2xl">🗑️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#DC5E4A' }}>Supprimer</p>
                <p className="text-xs mt-0.5" style={{ color: '#B5A89A' }}>Retirer de la bibliothèque</p>
              </div>
            </button>
          </div>
        )}

        {screen === 'confirm-delete' && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm" style={{ color: '#8A7B6A' }}>
              Supprimer <span className="font-semibold" style={{ color: '#2C2416' }}>{place.title}</span> définitivement ?
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
