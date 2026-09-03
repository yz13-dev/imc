import { useLayoutEffect, useMemo, useState } from "react"
import { columnsForWidth } from "./masonry-breakpoints"

export type UseMasonryColumnsOptions = {
  containerRef: React.RefObject<HTMLElement | null>
  count: number
  getAspectRatio: (index: number) => number
}

export function useMasonryColumns({ containerRef, count, getAspectRatio }: UseMasonryColumnsOptions) {
  const [columnCount, setColumnCount] = useState(() => columnsForWidth(0))
  const [isMeasured, setIsMeasured] = useState(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    setColumnCount(columnsForWidth(el.clientWidth))
    setIsMeasured(true)

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth
      setColumnCount(columnsForWidth(width))
    })
    observer.observe(el)

    return () => observer.disconnect()
  }, [containerRef])

  const columns = useMemo(() => {
    const result: number[][] = Array.from({ length: columnCount }, () => [])
    const heights = new Array(columnCount).fill(0)

    for (let i = 0; i < count; i++) {
      let shortest = 0
      for (let c = 1; c < columnCount; c++) {
        if (heights[c] < heights[shortest]!) shortest = c
      }
      result[shortest]!.push(i)
      heights[shortest] += 1 / getAspectRatio(i)
    }

    return result
  }, [columnCount, count, getAspectRatio])

  return { columnCount, columns, isMeasured }
}
