"use client"
import { createContext, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'

interface SelectionProps {
  selectedIds: Set<string>
}

interface SelectionState extends SelectionProps {
  toggle: (id: string) => void
  selectAll: (ids: string[]) => void
  clear: () => void
}

type SelectionStore = ReturnType<typeof createSelectionStore>

const createSelectionStore = (initProps?: Partial<SelectionProps>) => {
  const DEFAULT_PROPS: SelectionProps = {
    selectedIds: new Set(),
  }
  return createStore<SelectionState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    toggle: (id) => set((state) => {
      const selectedIds = new Set(state.selectedIds)
      if (selectedIds.has(id)) selectedIds.delete(id)
      else selectedIds.add(id)
      return { selectedIds }
    }),
    selectAll: (ids) => set({ selectedIds: new Set(ids) }),
    clear: () => set({ selectedIds: new Set() }),
  }))
}

export const SelectionContext = createContext<SelectionStore | null>(null)

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createSelectionStore())
  return <SelectionContext.Provider value={store}>{children}</SelectionContext.Provider>
}

export function useSelection<T>(selector: (state: SelectionState) => T): T {
  const store = useContext(SelectionContext)
  if (!store) throw new Error('Missing SelectionContext.Provider in the tree')
  return useStore(store, selector)
}
