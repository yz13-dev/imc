"use client"
import type { Attachment } from '@/types/attachments'
import type { Collection } from '@/types/collections'
import type { InboxItem } from '@/types/inbox'
import { createContext, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'
import { getCollectionAttachments, getInboxAttachments } from '../api/attachments'

interface GlobalStoreProps {
  collections: Collection[]
  inbox: InboxItem[]
  collectionsItems: Record<string, Attachment[]>
}

interface GlobalStoreState extends GlobalStoreProps {
  refreshInbox: () => Promise<void>
  setCollectionItems: (key: string, items: Attachment[]) => void
  refreshCollection: (key: string) => Promise<void>
}

type GlobalStoreStore = ReturnType<typeof createGlobalStoreStore>

const createGlobalStoreStore = (initProps?: Partial<GlobalStoreProps>) => {
  const DEFAULT_PROPS: GlobalStoreProps = {
    collections: [],
    inbox: [],
    collectionsItems: {},
  }
  return createStore<GlobalStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    refreshInbox: async () => {
      const inbox = await getInboxAttachments()
      if (inbox) set({ inbox: inbox || [] })
    },
    setCollectionItems: (key: string, items: Attachment[]) => {
      set((state) => ({ collectionsItems: { ...state.collectionsItems, [key]: items } }))
    },
    refreshCollection: async (key: string) => {
      const items = await getCollectionAttachments(key)
      if (items) set(state => ({ collectionsItems: { ...state.collectionsItems, [key]: items } }))
    },
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
