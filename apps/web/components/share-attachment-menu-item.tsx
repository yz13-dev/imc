"use client"

import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu"
import { Share2Icon } from "lucide-react"
import { SHARE_REQUEST_EVENT } from "@/app/(panel)/components/share-dialog-host"

export default function ShareAttachmentMenuItem({ attachmentId, title, isPublic = false }: { attachmentId: string, title?: string, isPublic?: boolean }) {
  return <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent(SHARE_REQUEST_EVENT, { detail: { type: "attachment", id: attachmentId, title, isPublic } }))}>
          <Share2Icon />
          <span>Поделиться</span>
      </DropdownMenuItem>
}
