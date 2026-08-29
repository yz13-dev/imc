"use client"

import { moveToTrashAttachment } from "@/lib/api/attachments"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Edit3Icon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import UpdateModal from "./update-modal"

export default function AttachmentActions({ attachment }: { attachment: AttachmentWithMaybeTagsAndSource }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const moveToTrash = async () => {
    await moveToTrashAttachment(attachment.id)
    router.push("/trash")
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
          <MoreHorizontalIcon />
          <span className="sr-only">Действия</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit3Icon />
            <span>Изменить</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant="error" onClick={moveToTrash}>
            <Trash2Icon />
            <span>Удалить</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <UpdateModal attachment={attachment} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
