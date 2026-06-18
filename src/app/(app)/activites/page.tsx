'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Place, PlaceFolder, ActivityType } from '@/lib/types'
import CreatePlaceModal from './CreatePlaceModal'
import PlaceActionSheet from './PlaceActionSheet'
import FolderActionSheet from './FolderActionSheet'
import { useCreateAction } from '@/contexts/CreateActionContext'
import PageFade from '@/components/PageFade'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useToast } from '@/contexts/ToastContext'

const FOLDER_EMOJIS = ['📁', '🗺️', '🍽️', '🏛️', '🌿', '🏨', '⭐', '❤️', '🔥', '🎭', '🏔️', '🌊']

const TYPE_CONFIG: Record<ActivityType, { emoji: string; color: string }> = {
  food:      { emoji: '🍽️', color: '#FEF3C7' },
  culture:   { emoji: '🏛️', color: '#E8F0E9' },
  transport: { emoji: '🚌', color: '#E8EFF7' },
  hotel:     { emoji: '🏨', color: '#F3E8F5' },
  nature:    { emoji: '🌿', color: '#E8F0E9' },
  other:     { emoji: '📌', color: '#F7F2EA' },
}

export default function BibliothequeePage() {
  const [folders, setFolders] = useState<PlaceFolder[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [folderStack, setFolderStack] = useState<PlaceFolder[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [folderAction, setFolderAction] = useState<PlaceFolder | null>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁')
  const [savingFolder, setSavingFolder] = useState(false)

  const { setAction } = useCreateAction()
  const { toast } = useToast()

  const currentFolder = folderStack.at(-1) ?? null
  const currentFolderId = currentFolder?.id ?? null
  const isAtRoot = folderStack.length === 0
  const canCreateSubfolder = folderStack.length < 2

  const visibleFolders = folders.filter(f => f.parent_id === currentFolderId)
  const visiblePlaces = places.filter(p => p.folder_id === currentFolderId)
  const filteredPlaces = filter === 'favorites' ? visiblePlaces.filter(p => p.is_favorite) : visiblePlaces

  const fetchAll = useCallback(async () => {
    const [fRes, pRes] = await Promise.all([
      supabase.from('place_folders').select('*').order('created_at'),
      supabase.from('places').select('*').order('created_at', { ascending: false }),
    ])
    setFolders(fRes.data ?? [])
    setPlaces(pRes.data ?? [])
    setLoading(false)
  }, [])

  const { refreshing } = usePullToRefresh(fetchAll)
  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    setAction(() => setShowModal(true))
    return () => setAction(null)
  }, [setAction])

  const toggleFavorite = async (place: Place) => {
    await supabase.from('places').update({ is_favorite: !place.is_favorite }).eq('id', place.id)
    setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, is_favorite: !p.is_favorite } : p))
  }

  const navigateInto = (folder: PlaceFolder) => {
    setFolderStack(prev => [...prev, folder])
    setFilter('all')
    setCreatingFolder(false)
  }

  const goBack = () => {
    setFolderStack(prev => prev.slice(0, -1))
    setFilter('all')
    setCreatingFolder(false)
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    setSavingFolder(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('place_folders').insert({
      user_id: user!.id,
      name: newFolderName.trim(),
      emoji: newFolderEmoji,
      parent_id: currentFolderId,
    }).select().single()
    if (data) {
      setFolders(prev => [...prev, data])
      toast.success(`Dossier "${data.name}" créé`)
    }
    setNewFolderName('')
    setNewFolderEmoji('📁')
    setCreatingFolder(false)
    setSavingFolder(false)
  }

  const folderItemCount = (folderId: string) =>
    folders.filter(f => f.parent_id === folderId).length +
    places.filter(p => p.folder_id === folderId).length

  return (
    <PageFade>
      <div className="px-5 pt-14 pb-28">
        {refreshing && (
          <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F5E8DF] border-t-[#C2714A]" />
          </div>
        )}

        {/* Header */}
        <div className="mb-5">
          {!isAtRoot && (
            <button onClick={goBack} className="mb-2 flex items-center gap-1 text-sm font-medium transition active:scale-95" style={{ color: '#C2714A' }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {folderStack.length === 1 ? 'Bibliothèque' : folderStack.at(-2)?.name}
            </button>
          )}
          {isAtRoot ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>Mes lieux</p>
              <h1 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Bibliothèque</h1>
            </>
          ) : (
            <h1 className="flex items-center gap-2 text-2xl font-bold" style={{ color: '#2C2416' }}>
              <span>{currentFolder?.emoji}</span>
              <span>{currentFolder?.name}</span>
            </h1>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex gap-2">
          {[{ key: 'all', label: 'Tous' }, { key: 'favorites', label: '⭐ Favoris' }].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key as 'all' | 'favorites')}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95"
              style={{ background: filter === tab.key ? '#C2714A' : '#F7F2EA', color: filter === tab.key ? '#FFFFFF' : '#8A7B6A' }}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs font-medium" style={{ color: '#B5A89A' }}>
            {filteredPlaces.length} lieu{filteredPlaces.length !== 1 ? 'x' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ background: '#F0E8DC' }} />)}
          </div>
        ) : (
          <>
            {/* Folders section */}
            {(visibleFolders.length > 0 || canCreateSubfolder) && (
              <div className="mb-5">
                {visibleFolders.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                    {visibleFolders.map(folder => {
                      const count = folderItemCount(folder.id)
                      return (
                        <div key={folder.id} className="relative">
                          <button onClick={() => navigateInto(folder)}
                            className="flex w-full items-center gap-3 rounded-2xl p-4 text-left transition active:scale-[0.97]"
                            style={{ background: '#F5E8DF', border: '1.5px solid #EDD9C8', boxShadow: '0 2px 8px rgba(44,36,22,0.06)' }}
                          >
                            <span className="text-2xl">{folder.emoji}</span>
                            <div className="flex-1 min-w-0 pr-6">
                              <p className="font-semibold text-sm truncate" style={{ color: '#2C2416' }}>{folder.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#B5A89A' }}>
                                {count > 0 ? `${count} élément${count > 1 ? 's' : ''}` : 'Vide'}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setFolderAction(folder) }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90"
                            style={{ background: '#EDD9C8', color: '#C2714A' }}
                          >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Create folder / subfolder */}
                {canCreateSubfolder && (
                  creatingFolder ? (
                    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(44,36,22,0.08)' }}>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>
                        {isAtRoot ? 'Nouveau dossier' : 'Nouveau sous-dossier'}
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {FOLDER_EMOJIS.map(e => (
                          <button key={e} type="button" onClick={() => setNewFolderEmoji(e)}
                            className="h-9 w-9 rounded-xl text-xl transition"
                            style={{ background: newFolderEmoji === e ? '#F5E8DF' : '#F7F2EA', border: `1.5px solid ${newFolderEmoji === e ? '#C2714A' : 'transparent'}` }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                      <input autoFocus type="text"
                        placeholder={isAtRoot ? 'Nom du dossier' : 'Nom du sous-dossier'}
                        value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && createFolder()}
                        className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                        style={{ borderColor: '#E8DFD0', color: '#2C2416', background: '#FAFAF7' }}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setCreatingFolder(false); setNewFolderName('') }}
                          className="flex-1 rounded-2xl py-3 text-sm font-semibold transition active:scale-95"
                          style={{ background: '#F7F2EA', color: '#8A7B6A' }}
                        >
                          Annuler
                        </button>
                        <button onClick={createFolder} disabled={!newFolderName.trim() || savingFolder}
                          className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                          style={{ background: '#C2714A' }}
                        >
                          {savingFolder ? '...' : 'Créer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setCreatingFolder(true)}
                      className="flex w-full items-center gap-3 rounded-2xl p-4 text-left transition active:scale-[0.97]"
                      style={{ border: '1.5px dashed #D6CABC', color: '#B5A89A' }}
                    >
                      <span className="text-xl">📁</span>
                      <span className="text-sm font-medium">
                        {isAtRoot ? 'Nouveau dossier' : 'Nouveau sous-dossier'}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Divider when both folders and places */}
            {visibleFolders.length > 0 && visiblePlaces.length > 0 && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#B5A89A' }}>
                {isAtRoot ? 'Sans dossier' : 'Dans ce dossier'}
              </p>
            )}

            {/* Places list */}
            {filteredPlaces.length === 0 && visibleFolders.length === 0 ? (
              <div className="mt-16 flex flex-col items-center gap-3 text-center">
                <div className="text-5xl">{filter === 'favorites' ? '⭐' : currentFolder?.emoji ?? '📍'}</div>
                <p className="font-semibold" style={{ color: '#2C2416' }}>
                  {filter === 'favorites' ? 'Aucun favori' : currentFolder ? 'Dossier vide' : 'Bibliothèque vide'}
                </p>
                <p className="text-sm" style={{ color: '#8A7B6A' }}>
                  {filter === 'favorites' ? 'Mets des lieux en favori' : 'Utilise le + pour ajouter un lieu'}
                </p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="mt-8 flex flex-col items-center gap-3 text-center">
                <p className="text-sm" style={{ color: '#8A7B6A' }}>
                  {filter === 'favorites' ? 'Aucun favori dans ce dossier' : ''}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPlaces.map(place => {
                  const cfg = TYPE_CONFIG[place.activity_type] ?? TYPE_CONFIG.other
                  return (
                    <div key={place.id} className="flex items-center gap-3 rounded-2xl p-4 shadow-sm" style={{ background: cfg.color }}>
                      <button onClick={() => setSelectedPlace(place)} className="flex flex-1 items-center gap-3 min-w-0 text-left transition active:scale-[0.98]">
                        <span className="text-2xl flex-shrink-0">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: '#2C2416' }}>{place.title}</p>
                          {place.location_name && <p className="text-xs mt-0.5 truncate" style={{ color: '#8A7B6A' }}>📍 {place.location_name}</p>}
                          {place.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#B5A89A' }}>{place.description}</p>}
                        </div>
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#B5A89A' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button onClick={() => toggleFavorite(place)} className="flex-shrink-0 text-xl transition active:scale-90 pl-2">
                        {place.is_favorite ? '⭐' : '☆'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <CreatePlaceModal
          defaultFolderId={currentFolderId}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchAll() }}
        />
      )}
      {selectedPlace && (
        <PlaceActionSheet
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onDone={() => { setSelectedPlace(null); fetchAll() }}
        />
      )}
      {folderAction && (
        <FolderActionSheet
          folder={folderAction}
          itemCount={folderItemCount(folderAction.id)}
          onClose={() => setFolderAction(null)}
          onRenamed={updated => {
            setFolders(prev => prev.map(f => f.id === updated.id ? updated : f))
            setFolderAction(null)
          }}
          onDeleted={folderId => {
            setFolders(prev => prev.filter(f => f.id !== folderId))
            setFolderStack(prev => prev.filter(f => f.id !== folderId))
            setFolderAction(null)
            fetchAll()
          }}
        />
      )}
    </PageFade>
  )
}
