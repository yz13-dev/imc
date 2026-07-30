"use client"
import { getQueryClient } from "@/lib/query-client";
import { useGlobalStore } from "@/lib/stores/global-store";
import { getApiUrl } from "@/lib/url";
import type { EventData } from "@/types/sse";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";


type ServerSideEventsProps = {
}

function getEventData<T extends EventData>(e: MessageEvent): T {
  return JSON.parse(e.data)
}

async function revalidate(q: QueryClient, key: string[]) {
  await q.invalidateQueries({ queryKey: key })
  await q.refetchQueries({ queryKey: key })
}

export default function ServerSideEvents({ }: ServerSideEventsProps) {

  const queryClient = getQueryClient()
  const collections = useGlobalStore(state => state.collections);
  const refreshInbox = useGlobalStore(state => state.refreshInbox);
  const refreshCollection = useGlobalStore(state => state.refreshCollection);
  const refreshCollections = useGlobalStore(state => state.refreshCollections);
  const refreshTrash = useGlobalStore(state => state.refreshTrash);

  const fullRefresh = async () => {
    await refreshInbox()
    await refreshCollections()
    await refreshTrash()
    for (const collection of collections) {
      await refreshCollection(collection.id)
    }
  }

  const onInboxChange = (e: MessageEvent) => {
    if (e.type === "inbox:new") {
      refreshInbox()
      revalidate(queryClient, ["inbox"])
    }
    if (e.type === "inbox:remove") {
      refreshInbox()
      revalidate(queryClient, ["inbox"])
    }
  }
  const onCollectionsChange = (e: MessageEvent) => {
    if (e.type === "collections:new") {
      refreshCollections()
      revalidate(queryClient, ["attachments", "collections"])
    }
    if (e.type === "collections:update") {
      refreshCollections()
      revalidate(queryClient, ["attachments", "collections"])
    }
    if (e.type === "collections:remove") {
      refreshCollections()
      revalidate(queryClient, ["attachments", "collections"])
    }
  }
  const onTrashChange = (e: MessageEvent) => {
    if (e.type === "trash:new") {
      fullRefresh()
      revalidate(queryClient, ["attachments", "trash"])
    }
    if (e.type === "trash:remove") {
      refreshTrash()
      revalidate(queryClient, ["attachments", "trash"])
    }
  }

  const onCollectionChange = (e: MessageEvent) => {
    if (e.type === "collection:new") {
      refreshCollections()
      const data = getEventData(e)
      revalidate(queryClient, ["attachments", "collection", data.id])
    }
    if (e.type === "collection:update") {
      refreshCollections()
      const data = getEventData(e)
      revalidate(queryClient, ["attachments", "collection", data.id])
    }
    if (e.type === "collection:remove") {
      refreshCollections()
      const data = getEventData(e)
      revalidate(queryClient, ["attachments", "collection", data.id])
    }
  }

  useEffect(() => {
    const es = new EventSource(getApiUrl("/v1/my/events"), {
      withCredentials: true
    })
    es.onopen = () => {
      console.log("[sse] connected")
    }
    es.onerror = (err) => {
      console.warn("[sse] connection error, browser will retry", err)
    }
    // inbox
    es.addEventListener("inbox:new", onInboxChange)
    es.addEventListener("inbox:remove", onInboxChange)
    //collection
    es.addEventListener("collection:new", onCollectionChange)
    es.addEventListener("collection:update", onCollectionChange)
    es.addEventListener("collection:remove", onCollectionChange)
    //collections
    es.addEventListener("collections:new", onCollectionsChange)
    es.addEventListener("collections:update", onCollectionsChange)
    es.addEventListener("collections:remove", onCollectionsChange)
    // trash
    es.addEventListener("trash:new", onTrashChange)
    es.addEventListener("trash:remove", onTrashChange)

    return () => {
      // inbox
      es.removeEventListener("inbox:new", onInboxChange)
      es.removeEventListener("inbox:remove", onInboxChange)
      //collection
      es.removeEventListener("collection:new", onCollectionChange)
      es.removeEventListener("collection:update", onCollectionChange)
      es.removeEventListener("collection:remove", onCollectionChange)
      //collections
      es.removeEventListener("collections:new", onCollectionsChange)
      es.removeEventListener("collections:update", onCollectionsChange)
      es.removeEventListener("collections:remove", onCollectionsChange)
      // trash
      es.removeEventListener("trash:new", onTrashChange)
      es.removeEventListener("trash:remove", onTrashChange)
    }
  }, [])
  return null
}
