import { flushSync } from "react-dom"

export function withViewTransition(update: () => void) {
  if (typeof document === "undefined" || !("startViewTransition" in document)) {
    update()
    return undefined
  }
  return document.startViewTransition(() => flushSync(update))
}

// ::view-transition-group() pseudo-elements stack in DOM discovery order by
// default (later elements paint on top), not by visual position. When many
// elements share the same view-transition-name pattern (e.g. every card in a
// grid, so any of them can be a future transition source), the one actually
// morphing can end up visually underneath unrelated, stationary siblings for
// as long as their boxes overlap. This forces one named group above all
// others for the duration of a single transition.
export function promoteViewTransitionGroup(name: string) {
  if (typeof document === "undefined") return () => { }
  const style = document.createElement("style")
  style.textContent = `::view-transition-group(${name}) { z-index: 1; }`
  document.head.appendChild(style)
  return () => style.remove()
}
