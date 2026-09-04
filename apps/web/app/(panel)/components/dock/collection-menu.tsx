"use client"
import { deleteCollection, updateCollectionPublic } from "@/lib/api/collections"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { ResponsiveDialog } from "@workspace/ui/components/responsive-dialog"
import { GlobeIcon, LockIcon, Settings2Icon, Share2Icon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SHARE_REQUEST_EVENT } from "../share-dialog-host"

type CollectionMenuProps = {
  collectionId: string
  title?: string
  public?: boolean
}

export default function CollectionMenu({ collectionId, title, public: isPublic = false }: CollectionMenuProps) {

  const router = useRouter()
  const queryClient = useQueryClient()
  const [accessDialogOpen, setAccessDialogOpen] = useState(false)
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false)

  const removeCollection = async () => {
    const result = await deleteCollection(collectionId)
    if (result) {
      router.push("/dashboard")
    }
  }

  const updateAccess = async (publicValue: boolean) => {
    if (isUpdatingAccess) return

    setIsUpdatingAccess(true)
    try {
      const updated = await updateCollectionPublic(collectionId, publicValue)
      if (!updated) return

      await queryClient.invalidateQueries({ queryKey: ["attachments", "collections"] })
      setAccessDialogOpen(false)
      router.refresh()
    } finally {
      setIsUpdatingAccess(false)
    }
  }

  const togglePublic = () => {
    if (isPublic) {
      void updateAccess(false)
      return
    }

    setAccessDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="icon" variant="ghost"><Settings2Icon className="size-5" /></Button>}
        />
        <DropdownMenuContent className="w-fit">
          <DropdownMenuItem onClick={togglePublic} disabled={isUpdatingAccess}>
            {isPublic ? <LockIcon /> : <GlobeIcon />}
            <span>{isPublic ? "Сделать приватной" : "Открыть доступ"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent(SHARE_REQUEST_EVENT, { detail: { type: "collection", id: collectionId, title, isPublic } }))}>
            <Share2Icon />
            <span>Поделиться</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={removeCollection}>
            <Trash2Icon />
            <span>Удалить коллекцию</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog
        open={accessDialogOpen}
        onOpenChange={setAccessDialogOpen}
        title="Открыть доступ к коллекции?"
        description="Коллекция станет доступна по ссылке всем, у кого она есть."
        footer={
          <>
            <Button variant="outline" disabled={isUpdatingAccess} onClick={() => setAccessDialogOpen(false)}>
              Отмена
            </Button>
            <Button disabled={isUpdatingAccess} onClick={() => void updateAccess(true)}>
              {isUpdatingAccess ? "Открываем доступ…" : "Открыть доступ"}
            </Button>
          </>
        }
      />
    </>
  )
}
