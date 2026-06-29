"use client"
import { moveAttachmentToCollection, moveToTrashAttachment, permanentlyDeleteAttachment } from "@/lib/api/attachments"
import { useGlobalStore } from "@/lib/stores/global-store"
import { useKeyHold } from "@tanstack/react-hotkeys"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { ExternalLinkIcon, ListPlusIcon, LockIcon, LockOpenIcon, Trash2Icon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import type { CSSProperties } from "react"
import { useState } from "react"

type CardDropdownMenuProps = {
  attachmentId: string
  children: React.ReactElement
  label?: string
  className?: string
  style?: CSSProperties
}


const removeAttachment = async (id: string) => {
  const result = await permanentlyDeleteAttachment(id)
  console.log("REMOVED", result)
}
const trashAttachment = async (id: string) => {
  const result = await moveToTrashAttachment(id)
  console.log("TRASHED", result)
}

export default function CardDropdownMenu({ className = "", children, attachmentId, style = {}, label = "Без названия" }: CardDropdownMenuProps) {
  const [open, setOpen] = useState<boolean>(false)
  const isMetaHeld = useKeyHold("Shift")

  const collections = useGlobalStore(state => state.collections)

  const moveToCollection = async (collectionId: string) => {
    await moveAttachmentToCollection(attachmentId, collectionId)
    setOpen(false)
  }

  const deleteAttachment = async (id: string) => {
    if (isMetaHeld) {
      await removeAttachment(id)
    } else {
      await trashAttachment(id)
    }
    setOpen(false)
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(open, details) => {
        if (details.reason === "trigger-press") details.cancel()
        else setOpen(open)
      }}
    >
      <AnimatePresence>
        {
          open &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-full h-svh z-50 py-6 backdrop-blur-sm flex items-end justify-center bg-black/10"
          />
        }
      </AnimatePresence>
      <DropdownMenuTrigger
        className={cn("relative", open && "z-50", className)}
        render={children}
        nativeButton={false}
        onClick={e => {
          if (open) {
            setOpen(false)
          } else {
            e.preventDefault()
            e.stopPropagation()
            e.preventBaseUIHandler()
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.preventBaseUIHandler()
          setOpen(!open)
        }}
        style={style}
      />
      <DropdownMenuContent
        className={cn("w-(--anchor-width)", open && "z-50")}
      >
        <DropdownMenuItem nativeButton={false} render={<Link href={`/ref/${attachmentId}`} />}>
          <ExternalLinkIcon />
          <span>
            Открыть
          </span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ListPlusIcon />
            <span>Добавить в</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuGroup>
              {
                collections.map(collection => (
                  <DropdownMenuItem key={collection.id} onClick={() => moveToCollection(collection.id)}>
                    {collection.public ? <LockOpenIcon /> : <LockIcon />}
                    {collection.name}
                  </DropdownMenuItem>
                ))
              }
            </DropdownMenuGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => deleteAttachment(attachmentId)}>
          <Trash2Icon />
          <AnimatePresence>
            {
              isMetaHeld
                ? <span>Окончательно удалить</span>
                : <span>Удалить</span>
            }
          </AnimatePresence>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
