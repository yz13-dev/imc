"use client"

import { getAttachment } from "@/lib/api/attachments"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { XIcon } from "lucide-react"
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

  const close = () => router.back()

  useEffect(() => {
    lockScroll()

    return () => {
      unlockScroll()
    }
  })
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto h-svh items-center justify-start bg-linear-to-t from-background to-transparent backdrop-blur-sm" onClick={close}>
      <div className="w-full">
        <div className="w-full mx-auto flex py-3 md:px-12 px-4 items-center justify-between">
          <h1 className="md:text-4xl text-xl font-medium line-clamp-1">
            {title}
          </h1>
          <div
            onClick={e => {
              e.stopPropagation()
            }}
            className="flex items-center gap-2"
          >
            <Button variant="ghost" size="icon" onClick={close}>
              <XIcon />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full mx-auto" onClick={stopPropagation}>
        {children}
      </div>
    </div>
  )
}
