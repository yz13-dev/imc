"use client"
import { useGlobalStore } from "@/lib/global-store";
import { getApiUrl } from "@/lib/url";
import { useEffect } from "react";



export default function ServerSideEvents() {

  const refreshInbox = useGlobalStore(state => state.refreshInbox);

  const onNewInbox = (e: MessageEvent) => {
    console.log(e)
    if (e.type === "inbox:new") {
      refreshInbox()
    }
  }

  useEffect(() => {
    const es = new EventSource(getApiUrl("/v1/my/events"), {
      withCredentials: true
    })

    es.addEventListener("inbox:new", onNewInbox)
    return () => {
      es.removeEventListener("inbox:new", onNewInbox)
    }
  }, [])
  return null
}
