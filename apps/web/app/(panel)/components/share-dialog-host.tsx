"use client"

import { publishAttachment } from "@/lib/api/attachments"
import { updateCollectionPublic } from "@/lib/api/collections"
import { attachmentPath, collectionPath } from "@/lib/routes"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { ResponsiveDialog } from "@workspace/ui/components/responsive-dialog"
import { CopyIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

type ShareRequest = {
  type: "attachment" | "collection"
  id: string
  title?: string
  isPublic: boolean
}

export const SHARE_REQUEST_EVENT = "share-request"

function getShareLink(value: ShareRequest) {
  const path = value.type === "attachment"
    ? attachmentPath(value.id, "public")
    : collectionPath(value.id, "public")
  return new URL(path, window.location.origin).toString()
}

export default function ShareDialogHost() {
  const queryClient = useQueryClient()
  const [request, setRequest] = useState<ShareRequest | null>(null)
  const [mode, setMode] = useState<"confirm" | "link">("confirm")
  const [link, setLink] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const nextRequest = (event as CustomEvent<ShareRequest>).detail
      setRequest(nextRequest)
      if (nextRequest.isPublic) void share(nextRequest)
      else setMode("confirm")
    }

    window.addEventListener(SHARE_REQUEST_EVENT, handleRequest)
    return () => window.removeEventListener(SHARE_REQUEST_EVENT, handleRequest)
  }, [])

  const share = async (value: ShareRequest) => {
    const url = getShareLink(value)
    if (navigator.share) {
      try { await navigator.share({ title: value.title, url }) } catch { /* cancelled */ }
      setRequest(null)
      return
    }
    setLink(url)
    setMode("link")
  }

  const confirm = async () => {
    if (!request || isPublishing) return
    setIsPublishing(true)
    try {
      const updated = request.type === "attachment"
        ? await publishAttachment(request.id)
        : await updateCollectionPublic(request.id, true)
      if (!updated) return

      // Publishing mutates the object in place. Refresh every active
      // attachment/collection view so a stale private copy cannot coexist
      // with the newly public representation in paginated caches.
      await queryClient.invalidateQueries({ queryKey: ["attachments"] })
      await share({ ...request, isPublic: true })
    } finally {
      setIsPublishing(false)
    }
  }

  const close = (open: boolean) => {
    if (!open) setRequest(null)
  }

  return (
    <ResponsiveDialog
      open={!!request}
      onOpenChange={close}
      title={mode === "confirm" ? "Открыть доступ?" : request?.type === "collection" ? "Поделиться коллекцией" : "Поделиться"}
      description={mode === "confirm"
        ? <span className="flex flex-wrap items-center gap-1">Доступ к <Badge variant="outline" className="max-w-full truncate">{request?.title || "этому объекту"}</Badge> будет открыт по ссылке всем, у кого она есть.</span>
        : "Скопируйте публичную ссылку, чтобы поделиться."}
      footer={mode === "confirm" && <><Button variant="outline" disabled={isPublishing} onClick={() => setRequest(null)}>Отмена</Button><Button disabled={isPublishing} onClick={confirm}>{isPublishing ? "Открываем доступ…" : "Продолжить"}</Button></>}
    >
      {mode === "link" && <div className="flex gap-2 px-4 sm:px-0"><Input readOnly value={link} /><Button size="icon" onClick={() => navigator.clipboard.writeText(link)}><CopyIcon /></Button></div>}
    </ResponsiveDialog>
  )
}
