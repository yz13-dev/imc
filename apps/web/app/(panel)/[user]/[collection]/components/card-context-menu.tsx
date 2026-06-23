"use client"
import { moveAttachmentToCollection, moveToTrashAttachment, permanentlyDeleteAttachment } from "@/lib/api/attachments"
import { useGlobalStore } from "@/lib/stores/global-store"
import { useKeyHold } from "@tanstack/react-hotkeys"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { Trash2Icon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

type CardDropdownMenuProps = {
  attachmentId: string
  children: React.ReactElement
}


const removeAttachment = async (id: string) => {
  await permanentlyDeleteAttachment(id)
}
const trashAttachment = async (id: string) => {
  await moveToTrashAttachment(id)
}

export default function CardDropdownMenu({ children, attachmentId }: CardDropdownMenuProps) {
  const [open, setOpen] = useState<boolean>(false)
  const isMetaHeld = useKeyHold("Shift")

  const collections = useGlobalStore(state => state.collections)

  const moveToCollection = async (collectionId: string) => {
    await moveAttachmentToCollection(attachmentId, collectionId)
    setOpen(false)
  }

  const deleteAttachment = async (id: string) => {
    if (isMetaHeld) {
      await trashAttachment(id)
    } else {
      await removeAttachment(id)
    }
    setOpen(false)
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(open, details) => {
        console.log("details", details)
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
            className="absolute inset-0 w-full h-svh z-50 py-6 backdrop-blur-sm flex items-end justify-center bg-black/10"
          />
        }
      </AnimatePresence>
      <DropdownMenuTrigger
        className={cn("relative", open && "z-50")}
        render={children}
        nativeButton={false}
        onClick={e => {
          console.log("click")
          e.preventDefault()
          e.stopPropagation()
          e.preventBaseUIHandler()
        }}
        onContextMenu={(e) => {
          console.log("context-click")
          e.preventDefault()
          e.stopPropagation()
          e.preventBaseUIHandler()
          setOpen(!open)
        }}
      />
      <DropdownMenuContent
        className={cn("w-(--anchor-width)", open && "z-50")}
      >
        <DropdownMenuItem onClick={() => deleteAttachment(attachmentId)}>
          <Trash2Icon />
          {
            isMetaHeld
              ? <span>Окончательно удалить</span>
              : <span>Удалить</span>
          }
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Добавить в</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuGroup>
              {
                collections.map(collection => (
                  <DropdownMenuItem key={collection.id} onClick={() => moveToCollection(collection.id)}>{collection.name}</DropdownMenuItem>
                ))
              }
            </DropdownMenuGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
