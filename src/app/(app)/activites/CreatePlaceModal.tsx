'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityType } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'
import FolderPickerSheet from './FolderPickerSheet'

interface Props {
  defaultFolderId?: string | null
  onClose: () => void
  onCreated: () => void
}

const TYPES: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'food',      label: 'Resto',     emoji: '🍽️' },
  { value: 'culture',   label: 'Culture',   emoji: '🏛️' },
  { value: 'nature',    label: 'Nature',    emoji: '🌿' },
  { value: 'hotel',     label: 'Hôtel',     emoji: '🏨' },
  { value: 'transport', label: 'Transport', emoji: '🚌' },
  { value: 'other',     label: 'Autre',     emoji: '📌' },
]

export default function CreatePlaceModal({ defaultFolderId = null, onClose, onCreated }: Props) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ActivityType>('other')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId ?? null)
  const [folderLabel, setFolderLabel] = useState<string | null>(null)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté'); setLoading(false); return }

    const { error: err } = await supabase.from('places').insert({
      user_id: user.id,
      title: title.trim(),
      activity_type: type,
      location_name: location.trim() || null,
      description: description.trim() || null,
      is_favorite: false,
      folder_id: folderId,
    })
    if (err) { setError(err.message); setLoading(false) }
    else { toast.success('Lieu ajouté à la bibliothèque 📍'); onCreated() }
  }

  const inputClass = "w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition placeholder:text-[#B5A89A]"
  const inputStyle = { borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
        <div className="animate-[slideUp_0.28s_ease-out] w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-10 pt-3 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="mb-5 flex justify-center">
            <div className="h-1 w-10 rounded-full" style={{ background: '#E8DFD0' }} />
          </div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: '#2C2416' }}>Nouveau lieu 📍</h2>
            <button onClick={onClose} style={{ color: '#B5A89A' }}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="text" placeholder="Nom du lieu *" value={title}
              onChange={e => setTitle(e.target.value)} required
              className={inputClass} style={inputStyle}
            />

            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className="flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-semibold transition active:scale-95"
                  style={{
                    background: type === t.value ? '#F5E8DF' : '#FAFAF7',
                    border: `1.5px solid ${type === t.value ? '#C2714A' : '#E8DFD0'}`,
                    color: type === t.value ? '#C2714A' : '#8A7B6A',
                  }}
                >
                  <span className="text-lg">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Adresse / Lieu (optionnel)" value={location}
              onChange={e => setLocation(e.target.value)}
              className={inputClass} style={inputStyle}
            />
            <textarea placeholder="Notes (optionnel)" value={description}
              onChange={e => setDescription(e.target.value)} rows={2}
              className={`${inputClass} resize-none`} style={inputStyle}
            />

            {/* Folder picker */}
            <button type="button" onClick={() => setShowFolderPicker(true)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.98]"
              style={{ border: '1.5px solid #E8DFD0', background: '#FAFAF7' }}
            >
              <span className="text-lg">📁</span>
              <span className="flex-1 text-sm" style={{ color: folderLabel ? '#2C2416' : '#B5A89A' }}>
                {folderLabel ?? (folderId ? '…' : 'Dossier (optionnel)')}
              </span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#B5A89A' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {error && <p className="text-sm" style={{ color: '#C2714A' }}>{error}</p>}
            <button type="submit" disabled={loading || !title.trim()}
              className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ background: '#C2714A', boxShadow: '0 4px 16px rgba(194,113,74,0.35)' }}
            >
              {loading ? 'Ajout...' : 'Ajouter à la bibliothèque'}
            </button>
          </form>
        </div>
      </div>

      {showFolderPicker && (
        <FolderPickerSheet
          onSelect={(id, label) => { setFolderId(id); setFolderLabel(label === 'Sans dossier' ? null : label); setShowFolderPicker(false) }}
          onClose={() => setShowFolderPicker(false)}
        />
      )}
    </>
  )
}
