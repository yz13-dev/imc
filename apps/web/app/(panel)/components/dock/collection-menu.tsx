"use client"
import { deleteCollection, updateCollectionPublic } from "@/lib/api/collections"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { GlobeIcon, LockIcon, Settings2Icon, Share2Icon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { SHARE_REQUEST_EVENT } from "../share-dialog-host"

type CollectionMenuProps = {
  collectionId: string
  title?: string
  public?: boolean
}

export default function CollectionMenu({ collectionId, title, public: isPublic = false }: CollectionMenuProps) {

  const router = useRouter()

  const removeCollection = async () => {
    const result = await deleteCollection(collectionId)
    if (result) {
      router.push("/dashboard")
    }
  }

  const togglePublic = async () => {
    if (!isPublic && !window.confirm("Коллекция станет публичной и будет доступна всем, у кого есть ссылка. Продолжить?")) return
    await updateCollectionPublic(collectionId, !isPublic)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="icon" variant="ghost"><Settings2Icon className="size-5" /></Button>}
      />
      <DropdownMenuContent className="w-fit">
        <DropdownMenuItem onClick={togglePublic}>
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
  )
}
