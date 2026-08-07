"use client"
import type { OverlayProps } from "@/components/overlay";
import Overlay from "@/components/overlay";
import useCover from "@/hooks/use-cover";
import { withViewTransition } from "@/lib/view-transition";
import { useHotkey } from "@tanstack/react-hotkeys";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";


type CoverProps = {
  coverKey?: string
} & OverlayProps

export default function Cover({ children, coverKey = "id" }: CoverProps) {
  const { lock, unlock } = useCover()
  const [id, setId] = useQueryState(coverKey, parseAsString)
  useEffect(() => {
    if (!id) {
      unlock()
      return
    }
    lock()
    return () => unlock()
  }, [id])
  useHotkey("Escape", () => {
    withViewTransition(() => setId(null))
  }, { enabled: !!id })
  if (!id) return null
  return (
    <Overlay
      onClick={e => {
        e.stopPropagation()
        withViewTransition(() => setId(null))
      }}
    >
      {children}
    </Overlay>
  )
}
