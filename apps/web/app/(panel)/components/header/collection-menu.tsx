"use client"
import { deleteCollection } from "@/lib/api/collections"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { MenuIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"

type CollectionMenuProps = {
  collectionId: string
}

export default function CollectionMenu({ collectionId }: CollectionMenuProps) {

  const router = useRouter()

  const removeCollection = async () => {
    const result = await deleteCollection(collectionId)
    if (result) {
      router.push("/dashboard")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="icon" variant="outline"><MenuIcon /></Button>}
      />
      <DropdownMenuContent className="w-fit">
        <DropdownMenuItem onClick={removeCollection}>
          <Trash2Icon />
          <span>Удалить коллекцию</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
