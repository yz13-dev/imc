"use client"
import type { AttachmentWithMaybeTagsAndSource } from '@/types/attachments'
import type { Collection } from '@/types/collections'
import type { InboxItem } from '@/types/inbox'
import { createContext, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'
import { getCollectionAttachments, getInboxAttachments, getTrashAttachments } from '../api/attachments'
import { getCollections } from '../api/collections'

interface GlobalStoreProps {
  all: AttachmentWithMaybeTagsAndSource[]
  collections: Collection[]
  inbox: InboxItem[]
  trash: AttachmentWithMaybeTagsAndSource[]
  collectionsItems: Record<string, AttachmentWithMaybeTagsAndSource[]>
}

interface GlobalStoreState extends GlobalStoreProps {
  setAll: (all: AttachmentWithMaybeTagsAndSource[]) => void
  setInbox: (inbox: InboxItem[]) => void
  refreshInbox: () => Promise<void>
  setCollectionItems: (key: string, items: AttachmentWithMaybeTagsAndSource[]) => void
  refreshCollection: (key: string) => Promise<void>
  refreshCollections: () => Promise<void>
  setTrash: (trash: AttachmentWithMaybeTagsAndSource[]) => void
  refreshTrash: () => Promise<void>
}

type GlobalStoreStore = ReturnType<typeof createGlobalStoreStore>

const createGlobalStoreStore = (initProps?: Partial<GlobalStoreProps>) => {
  const DEFAULT_PROPS: GlobalStoreProps = {
    all: [],
    collections: [],
    inbox: [],
    trash: [],
    collectionsItems: {},
  }
  return createStore<GlobalStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setAll: (all: AttachmentWithMaybeTagsAndSource[]) => {
      set({ all })
    },
    setInbox: (inbox: InboxItem[]) => {
      set({ inbox })
    },
    refreshInbox: async () => {
      const inbox = await getInboxAttachments()
      if (inbox) set({ inbox: inbox || [] })
    },
    setCollectionItems: (key, items) => {
      set((state) => ({ collectionsItems: { ...state.collectionsItems, [key]: items } }))
    },
    refreshCollection: async (key) => {
      const items = await getCollectionAttachments(key)
      if (items) set(state => ({ collectionsItems: { ...state.collectionsItems, [key]: items } }))
    },
    refreshCollections: async () => {
      const collections = await getCollections()
      if (collections) set({ collections: collections || [] })
    },
    setTrash: (trash) => {
      set({ trash })
    },
    refreshTrash: async () => {
      const trash = await getTrashAttachments()
      if (trash) set({ trash: trash || [] })
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
