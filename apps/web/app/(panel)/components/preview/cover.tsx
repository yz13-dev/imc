"use client"
import type { OverlayProps } from "@/components/overlay";
import Overlay from "@/components/overlay";
import useCover from "@/hooks/use-cover";
import { promoteViewTransitionGroup, withViewTransition } from "@/lib/view-transition";
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
  const close = () => {
    // Same DOM-order stacking gotcha as opening (see promoteViewTransitionGroup) —
    // less visible on close since the shrinking box rarely overlaps other
    // grid cards early on, but keep it consistent.
    const unpromote = id ? promoteViewTransitionGroup(`attachment-${id}`) : undefined
    const transition = withViewTransition(() => setId(null))
    if (transition) {
      transition.finished.finally(() => unpromote?.())
    } else {
      unpromote?.()
    }
  }
  useHotkey("Escape", close, { enabled: !!id })
  if (!id) return null
  return (
    <Overlay
      onClick={e => {
        e.stopPropagation()
        close()
      }}
    >
      {children}
    </Overlay>
  )
}
