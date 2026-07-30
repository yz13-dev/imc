"use client"
import { getQueryClient } from "@/lib/query-client";
import { useGlobalStore } from "@/lib/stores/global-store";
import { getApiUrl } from "@/lib/url";
import type { EventData } from "@/types/sse";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";


type ServerSideEventsProps = {
}

type SSESubscription = [string, (e: MessageEvent) => void]

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

  const collectionsRef = useRef(collections)
  useEffect(() => {
    collectionsRef.current = collections
  }, [collections])

  const subscriptions = useMemo<SSESubscription[]>(() => {
    const onInboxChange = () => {
      refreshInbox()
      revalidate(queryClient, ["attachments", "inbox"])
    }
    const onCollectionsChange = () => {
      refreshCollections()
      revalidate(queryClient, ["attachments", "collections"])
    }
    const onCollectionChange = (e: MessageEvent) => {
      refreshCollections()
      const data = getEventData(e)
      revalidate(queryClient, ["attachments", "collection", data.id])
    }
    const onTrashNew = async () => {
      await refreshInbox()
      await refreshCollections()
      await refreshTrash()
      for (const collection of collectionsRef.current) {
        await refreshCollection(collection.id)
      }
      revalidate(queryClient, ["attachments", "trash"])
    }
    const onTrashRemove = () => {
      refreshTrash()
      revalidate(queryClient, ["attachments", "trash"])
    }

    return [
      ["inbox:new", onInboxChange],
      ["inbox:remove", onInboxChange],
      ["collection:new", onCollectionChange],
      ["collection:update", onCollectionChange],
      ["collection:remove", onCollectionChange],
      ["collections:new", onCollectionsChange],
      ["collections:update", onCollectionsChange],
      ["collections:remove", onCollectionsChange],
      ["trash:new", onTrashNew],
      ["trash:remove", onTrashRemove],
    ]
  }, [queryClient, refreshInbox, refreshCollection, refreshCollections, refreshTrash])

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

    const isDev = process.env.NODE_ENV !== "production"
    const wrapped: SSESubscription[] = subscriptions.map(([type, handler]) => {
      if (!isDev) return [type, handler]
      return [type, (e: MessageEvent) => {
        try {
          console.log(`[sse] ${type}`, e.data ? JSON.parse(e.data) : undefined)
        } catch {
          console.log(`[sse] ${type}`, e.data)
        }
        handler(e)
      }]
    })

    for (const [type, handler] of wrapped) {
      es.addEventListener(type, handler)
    }

    return () => {
      for (const [type, handler] of wrapped) {
        es.removeEventListener(type, handler)
      }
      es.close()
    }
  }, [subscriptions])
  return null
}
