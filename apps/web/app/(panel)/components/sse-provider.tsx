"use client"
import { getQueryClient } from "@/lib/query-client";
import { useGlobalStore } from "@/lib/stores/global-store";
import { getApiUrl } from "@/lib/url";
import type { EventData } from "@/types/sse";
import { useEffect } from "react";


type ServerSideEventsProps = {
}

function getEventData<T extends EventData>(e: MessageEvent): T {
  return JSON.parse(e.data)
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
    console.log("[ NEW INBOX EVENT ]", e, e.type)
    if (e.type === "inbox:new") {
      refreshInbox()
      queryClient.invalidateQueries({ queryKey: ["attachments", "inbox"] })
    }
    if (e.type === "inbox:remove") {
      refreshInbox()
      queryClient.invalidateQueries({ queryKey: ["attachments", "inbox"] })
    }
  }
  const onCollectionsChange = (e: MessageEvent) => {
    console.log("[ NEW COLLECTIONS EVENT ]", e, e.type)
    if (e.type === "collections:new") {
      refreshCollections()
      queryClient.invalidateQueries({ queryKey: ["attachments", "collections"] })
    }
    if (e.type === "collections:update") {
      refreshCollections()
      queryClient.invalidateQueries({ queryKey: ["attachments", "collections"] })
    }
    if (e.type === "collections:remove") {
      refreshCollections()
      queryClient.invalidateQueries({ queryKey: ["attachments", "collections"] })
    }
  }
  const onTrashChange = (e: MessageEvent) => {
    console.log("[ NEW TRASH EVENT ]", e, e.type)
    if (e.type === "trash:new") {
      fullRefresh()
      queryClient.invalidateQueries({ queryKey: ["attachments", "trash"] })
    }
    if (e.type === "trash:remove") {
      refreshTrash()
      queryClient.invalidateQueries({ queryKey: ["attachments", "trash"] })
    }
  }

  const onCollectionChange = (e: MessageEvent) => {
    console.log("[ NEW COLLECTION EVENT ]", e, e.type)
    if (e.type === "collection:new") {
      refreshCollections()
      const data = getEventData(e)
      queryClient.invalidateQueries({ queryKey: ["attachments", "collection", data.id] })
    }
    if (e.type === "collection:update") {
      refreshCollections()
      const data = getEventData(e)
      queryClient.invalidateQueries({ queryKey: ["attachments", "collection", data.id] })
    }
    if (e.type === "collection:remove") {
      refreshCollections()
      const data = getEventData(e)
      queryClient.invalidateQueries({ queryKey: ["attachments", "collection", data.id] })
    }
  }

  useEffect(() => {
    const es = new EventSource(getApiUrl("/v1/my/events"), {
      withCredentials: true
    })
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
