"use client"
import { useGlobalStore } from "@/lib/stores/global-store";
import { getApiUrl } from "@/lib/url";
import { useEffect } from "react";


type ServerSideEventsProps = {
}

export default function ServerSideEvents({ }: ServerSideEventsProps) {

  const refreshInbox = useGlobalStore(state => state.refreshInbox);
  const refreshCollection = useGlobalStore(state => state.refreshCollection);

  const onInboxChange = (e: MessageEvent) => {
    console.log("[ NEW INBOX EVENT ]", e, e.type)
    if (e.type === "inbox:new") {
      refreshInbox()
    }
    if (e.type === "inbox:remove") {
      refreshInbox()
    }
  }
  const onCollectionChange = (e: MessageEvent) => {
    console.log("[ NEW COLLECTION EVENT ]", e, e.type)
    if (e.type === "collection:new") {
      refreshCollection(e.data)
    }
    if (e.type === "collection:update") {
      refreshCollection(e.data)
    }
    if (e.type === "collection:remove") {
      refreshCollection(e.data)
    }
  }

  useEffect(() => {
    const es = new EventSource(getApiUrl("/v1/my/events"), {
      withCredentials: true
    })
    es.addEventListener("inbox:new", onInboxChange)
    es.addEventListener("inbox:remove", onInboxChange)
    es.addEventListener("collection:new", onCollectionChange)
    es.addEventListener("collection:update", onCollectionChange)
    es.addEventListener("collection:remove", onCollectionChange)
    return () => {
      es.removeEventListener("inbox:new", onInboxChange)
      es.removeEventListener("inbox:remove", onInboxChange)
      es.removeEventListener("collection:new", onCollectionChange)
      es.removeEventListener("collection:update", onCollectionChange)
      es.removeEventListener("collection:remove", onCollectionChange)
    }
  }, [])
  return null
}
