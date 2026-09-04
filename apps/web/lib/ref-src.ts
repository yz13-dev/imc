


export function getRefSrc(ref?: string | null) {
  if (!ref) return undefined
  const refId = ref.split("/").pop()
  return refId
}
