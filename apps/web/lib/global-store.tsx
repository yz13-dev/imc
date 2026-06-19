"use client"
import type { Collection } from '@/types/collections'
import { createContext, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'

interface GlobalStoreProps {
  collections: Collection[]
}

interface GlobalStoreState extends GlobalStoreProps {
}

type GlobalStoreStore = ReturnType<typeof createGlobalStoreStore>

const createGlobalStoreStore = (initProps?: Partial<GlobalStoreProps>) => {
  const DEFAULT_PROPS: GlobalStoreProps = {
    collections: [],
  }
  return createStore<GlobalStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
  }))
}

export const GlobalStoreContext = createContext<GlobalStoreStore | null>(null)

type GlobalStoreProviderProps = React.PropsWithChildren<Partial<GlobalStoreProps>>

export function GlobalStoreProvider({ children, ...props }: GlobalStoreProviderProps) {
  const [store] = useState(() => createGlobalStoreStore(props))

  return <GlobalStoreContext.Provider value={store}>{children}</GlobalStoreContext.Provider>
}

export function useGlobalStore<T>(selector: (state: GlobalStoreState) => T): T {
  const store = useContext(GlobalStoreContext)
  if (!store) throw new Error('Missing GlobalStoreContext.Provider in the tree')
  return useStore(store, selector)
}
