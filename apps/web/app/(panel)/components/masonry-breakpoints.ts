export type MasonryBreakpoint = {
  minWidth: number
  columns: number
}

export const MASONRY_BREAKPOINTS: MasonryBreakpoint[] = [
  { minWidth: 0, columns: 1 },
  { minWidth: 512, columns: 2 },
  { minWidth: 576, columns: 3 },
  { minWidth: 896, columns: 4 },
  { minWidth: 1024, columns: 5 },
  { minWidth: 1280, columns: 6 },
]

export function columnsForWidth(width: number): number {
  let columns = MASONRY_BREAKPOINTS[0]!.columns
  for (const breakpoint of MASONRY_BREAKPOINTS) {
    if (width >= breakpoint.minWidth) columns = breakpoint.columns
  }
  return columns
}

// CSS-columns equivalent of MASONRY_BREAKPOINTS, used to lay out generic
// placeholder blocks before we've measured the container and can compute
// the real JS masonry columns — avoids a blank screen on first paint.
export const CSS_COLUMNS_CLASSNAME =
  "@7xl:columns-6 @6xl:columns-5 @5xl:columns-5 @4xl:columns-4 @xl:columns-3 @lg:columns-2 @sm:columns-1 space-y-2 gap-x-2"
