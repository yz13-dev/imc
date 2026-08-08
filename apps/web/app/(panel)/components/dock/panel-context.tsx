"use client"
import { createContext, useContext, useMemo, useState } from "react"

type DockPanel = {
  id: string
  content: React.ReactNode
}

type DockPanelContextValue = {
  panel: DockPanel | null
  open: (id: string, content: React.ReactNode) => void
  close: () => void
  // Opens `content` under `id`, or closes if that same panel is already open —
  // the usual behavior for a dock button that toggles its own menu.
  toggle: (id: string, content: React.ReactNode) => void
}

const DockPanelContext = createContext<DockPanelContextValue | null>(null)

export function DockPanelProvider({ children }: { children: React.ReactNode }) {
  const [panel, setPanel] = useState<DockPanel | null>(null)

  const value = useMemo<DockPanelContextValue>(() => ({
    panel,
    open: (id, content) => setPanel({ id, content }),
    close: () => setPanel(null),
    toggle: (id, content) => setPanel(current => current?.id === id ? null : { id, content }),
  }), [panel])

  return <DockPanelContext.Provider value={value}>{children}</DockPanelContext.Provider>
}

// Any dock item — built-in or added later — can call this to show its own
// content in the dock's shared top slot, without panel.tsx needing to know
// about it ahead of time.
export function useDockPanel() {
  const context = useContext(DockPanelContext)
  if (!context) throw new Error("useDockPanel must be used within a DockPanelProvider")
  return context
}
