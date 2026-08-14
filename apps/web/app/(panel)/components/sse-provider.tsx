"use client"
import { getQueryClient } from "@/lib/query-client";
import { getApiProxyUrl } from "@/lib/url";
import type { EventData } from "@/types/sse";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";


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

  const subscriptions = useMemo<SSESubscription[]>(() => {
    const onInboxChange = () => {
      revalidate(queryClient, ["attachments", "inbox"])
    }
    const onCollectionsChange = () => {
      revalidate(queryClient, ["attachments", "collections"])
    }
    const onCollectionChange = (e: MessageEvent) => {
      const data = getEventData(e)
      revalidate(queryClient, ["attachments", "collections", data.id])
    }
    const onTrashNew = () => {
      revalidate(queryClient, ["attachments", "inbox"])
      // Prefix match: refetches the collections list *and* every
      // individual collection's contents currently in the cache, since we
      // don't reliably know client-side which collection(s) this affects.
      revalidate(queryClient, ["attachments", "collections"])
      revalidate(queryClient, ["attachments", "trash"])
    }
    const onTrashRemove = () => {
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
  }, [queryClient])

  useEffect(() => {
    const es = new EventSource(getApiProxyUrl("/v1/my/events"), {
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
