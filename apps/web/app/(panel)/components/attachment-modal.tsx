"use client"

import { Button } from "@workspace/ui/components/button"
import { XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import type { MouseEvent, ReactNode } from "react"

export default function AttachmentModal({ children }: { children: ReactNode }) {
  const router = useRouter()

  const close = () => router.back()
  const stopPropagation = (event: MouseEvent) => event.stopPropagation()

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-svh items-center justify-center bg-black/10 backdrop-blur-sm md:px-6 px-2" onClick={close}>
      <div className="container mx-auto flex py-3 md:px-6 px-2 items-center justify-end">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={close}>
            <XIcon />
          </Button>
        </div>
      </div>
      <div className="max-h-full w-full container overflow-y-auto rounded-t-2xl bg-background shadow-xl" onClick={stopPropagation}>
        {children}
      </div>
    </div>
  )
}
