export function skeletonAspectRatio(index: number): number {
  if (index % 4 === 0) return 1
  if (index % 3 === 0) return 9 / 16
  if (index % 2 === 0) return 16 / 9
  return 1
}
