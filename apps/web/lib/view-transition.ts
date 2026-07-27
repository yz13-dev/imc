import { flushSync } from "react-dom"

export function withViewTransition(update: () => void) {
  console.log("TRANSISITION", ("startViewTransition" in document))
  if (typeof document === "undefined" || !("startViewTransition" in document)) {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}
