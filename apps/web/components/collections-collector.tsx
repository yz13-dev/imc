"use client"

import { getCollectionAttachments } from "@/lib/api/attachments"
import { useGlobalStore } from "@/lib/stores/global-store"
import type { Collection } from "@/types/collections"
import { useEffect } from "react"

type CollectionsCollectorProps = {
  collections?: Collection[]
}

const getCollection = async (id: string) => {
  const attachments = await getCollectionAttachments(id)
  return { id, attachments }
}
const getCollections = (ids: string[]) => {
  return Promise.all(ids.map((id) => getCollection(id)))
}


export default function CollectionsCollector({ collections }: CollectionsCollectorProps) {

  const setCollectionsAttachments = useGlobalStore(state => state.setCollectionItems)

  const collectAttachments = async () => {
    if (!collections?.length) return
    const ids = collections.map(c => c.id)
    const collectionsAttachments = await getCollections(ids)
    for (const collection of collectionsAttachments) {
      setCollectionsAttachments(collection.id, (collection.attachments || []))
    }
  }

  useEffect(() => {
    if (!collections?.length) return
    collectAttachments()
  }, [collections])
  return null
}
