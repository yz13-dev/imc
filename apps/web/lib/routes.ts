type Visibility = "private" | "public"

export function attachmentPath(id: string, visibility: Visibility = "private") {
  return visibility === "public" ? `/public/${id}` : `/${id}`
}

export function collectionPath(id: string, visibility: Visibility = "private") {
  return visibility === "public" ? `/public/collection/${id}` : `/collection/${id}`
}
