"use client"
import { moveAttachmentToCollection } from "@/lib/api/attachments"
import { useGlobalStore } from "@/lib/stores/global-store"
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@workspace/ui/components/context-menu"

type CardContextMenuProps = {
  attachmentId: string
  children: React.ReactNode
}
export default function CardContextMenu({ children, attachmentId }: CardContextMenuProps) {
  const collections = useGlobalStore(state => state.collections)

  const moveToCollection = async (collectionId: string) => {
    console.log(await moveAttachmentToCollection(attachmentId, collectionId))
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuSub>
          <ContextMenuSubTrigger>Добавить в</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuGroup>
              {
                collections.map(collection => (
                  <ContextMenuItem key={collection.id} onClick={() => moveToCollection(collection.id)}>{collection.name}</ContextMenuItem>
                ))
              }
            </ContextMenuGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}
