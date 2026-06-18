'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type Fn = () => void

type CreateActionContextType = {
  action: Fn | null
  setAction: (fn: Fn | null) => void
}

const CreateActionContext = createContext<CreateActionContextType>({
  action: null,
  setAction: () => {},
})

export function CreateActionProvider({ children }: { children: React.ReactNode }) {
  const [action, setActionState] = useState<Fn | null>(null)

  const setAction = useCallback((fn: Fn | null) => {
    if (fn === null) {
      setActionState(null)
    } else {
      setActionState(() => fn)
    }
  }, [])

  return (
    <CreateActionContext.Provider value={{ action, setAction }}>
      {children}
    </CreateActionContext.Provider>
  )
}

export function useCreateAction() {
  return useContext(CreateActionContext)
}
