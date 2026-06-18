


export function getRefSrc(ref: string) {
  const refId = ref.split("/").pop()
  return refId
}
