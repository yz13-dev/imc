"use client"

import { getAttachment } from "@/lib/api/attachments"
import { getAssetsProxyUrl } from "@/lib/url"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { DownloadIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, type MouseEvent, type ReactNode } from "react"

const stopPropagation = (event: MouseEvent) => event.stopPropagation()

const lockScroll = () => {
  document.body.style.overflow = "hidden"
}
const unlockScroll = () => {
  document.body.style.overflow = "auto"
}

export default function AttachmentModal({ children, id }: { children: ReactNode, id: string }) {
  const router = useRouter()
  const { data } = useQuery({
    queryKey: ["attachment", id],
    queryFn: () => getAttachment(id),
  })

  const title = data?.label;

  const downloadAttachment = async () => {
    if (!data) return
    const { src, label } = data
    try {
      const resolvedId = id // getRefSrc(src) || src;
      const refSrc = getAssetsProxyUrl(`/${resolvedId || src}`)
      const response = await fetch(refSrc)

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = label || "attachment"
      link.click()

      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error(error)
    }
  }

  const close = () => router.back()

  useEffect(() => {
    lockScroll()

    return () => {
      unlockScroll()
    }
  })
  return (
    <div className="fixed inset-0 z-50 flex flex-col h-svh items-center justify-start bg-linear-to-t from-background to-transparent backdrop-blur-lg" onClick={close}>
      <div className="w-full max-w-4xl mx-auto flex py-3 md:px-12 px-4 items-center justify-between">
        <h1 className="md:text-4xl text-xl font-medium line-clamp-1">
          {title}
        </h1>
        <div
          onClick={e => {
            e.stopPropagation()
          }}
          className="flex items-center gap-2"
        >
          <Button variant="ghost" aria-label="Скачать файл" onClick={downloadAttachment}>
            <DownloadIcon />
            <span className="md:inline hidden">Скачать файл</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={close}>
            <XIcon />
          </Button>
        </div>
      </div>
      <div className="w-full max-w-4xl mx-auto overflow-y-auto" onClick={stopPropagation}>
        {children}
      </div>
    </div>
  )
}
