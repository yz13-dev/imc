"use client"
import { moveAttachmentToCollection, moveToTrashAttachment } from "@/lib/api/attachments"
import { createCollection, getCollections } from "@/lib/api/collections"
import { useSelection } from "@/lib/stores/selection-store"
import { useUser } from "@/lib/stores/user"
import { useHotkey } from "@tanstack/react-hotkeys"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { Separator } from "@workspace/ui/components/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { ListPlusIcon, LockIcon, LockOpenIcon, SquareLibraryIcon, Trash2Icon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useDockPanel } from "../../components/dock/panel-context"

// Mounted once inside InboxGrid — has no visual output of its own, it just
// keeps the dock's shared panel slot in sync with the selection count.
export function InboxSelectionDockSync() {
  const count = useSelection(state => state.selectedIds.size)
  const { panel, open, close } = useDockPanel()
  const panelRef = useRef(panel)
  panelRef.current = panel

  useEffect(() => {
    if (count > 0) open("bulk-actions", <InboxBulkActionsPanel />)
    else if (panelRef.current?.id === "bulk-actions") close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  useEffect(() => () => {
    if (panelRef.current?.id === "bulk-actions") close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function InboxBulkActionsPanel() {
  const selectedIds = useSelection(state => state.selectedIds)
  const clear = useSelection(state => state.clear)
  const count = selectedIds.size
  const user = useUser(state => state.user)
  const queryClient = useQueryClient()

  const [busy, setBusy] = useState(false)
  const [creatingName, setCreatingName] = useState<string | null>(null)

  const { data: collections } = useQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  const ids = () => Array.from(selectedIds)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["attachments", "inbox"] })
    queryClient.invalidateQueries({ queryKey: ["attachments", "collections"] })
  }

  const addToCollection = async (collectionId: string) => {
    setBusy(true)
    try {
      await Promise.all(ids().map(id => moveAttachmentToCollection(id, collectionId)))
      invalidate()
      clear()
    } finally {
      setBusy(false)
    }
  }

  const createFromSelection = async () => {
    if (!user || !creatingName?.trim()) return
    setBusy(true)
    try {
      const collection = await createCollection({ name: creatingName.trim(), description: "", user_id: user.id })
      if (collection) {
        await Promise.all(ids().map(id => moveAttachmentToCollection(id, collection.id)))
        invalidate()
        setCreatingName(null)
        clear()
      }
    } finally {
      setBusy(false)
    }
  }

  const moveToTrash = async () => {
    setBusy(true)
    try {
      await Promise.all(ids().map(id => moveToTrashAttachment(id)))
      queryClient.invalidateQueries({ queryKey: ["attachments", "inbox"] })
      queryClient.invalidateQueries({ queryKey: ["attachments", "trash"] })
      clear()
    } finally {
      setBusy(false)
    }
  }

  useHotkey("Escape", () => creatingName !== null ? setCreatingName(null) : clear())

  if (creatingName !== null) {
    return (
      <div className="dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-xl border p-2 flex items-center gap-2 w-full max-w-md">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <SquareLibraryIcon />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            placeholder="Название коллекции"
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
          />
        </InputGroup>
        <Button variant="ghost" disabled={busy} onClick={() => setCreatingName(null)}>Отмена</Button>
        <Button disabled={!creatingName.trim() || busy} onClick={createFromSelection}>Создать</Button>
      </div>
    )
  }

  return (
    <div className="dark:bg-muted/50 w-fit bg-muted/80 backdrop-blur-xs rounded-xl border p-1 flex items-center gap-1">
      <div className="h-8 min-w-8 flex items-center justify-center">
        <span className="px-2 text-base text-muted-foreground shrink-0">{count}</span>
      </div>
      <Separator orientation="vertical" className="mx-1 w-px h-8" />
      <Tooltip>
        <TooltipTrigger render={
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setCreatingName("")}>
            <SquareLibraryIcon className="size-5" />
            <span className="sr-only">Новая коллекция</span>
          </Button>
        }
        />
        <TooltipContent>Новая коллекция</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <Tooltip defaultOpen>
          <TooltipTrigger render={
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="sm" disabled={busy}>
                <ListPlusIcon className="size-5" />
                <span className="sr-only">Добавить в</span>
              </Button>
            }
            />
          }
          />
          <TooltipContent>Добавить в коллекцию</TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          {
            (collections || []).map(collection => (
              <DropdownMenuItem key={collection.id} onClick={() => addToCollection(collection.id)}>
                {collection.public ? <LockOpenIcon /> : <LockIcon />}
                <span>{collection.name}</span>
              </DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger render={
          <Button variant="ghost" size="sm" disabled={busy} onClick={moveToTrash}>
            <Trash2Icon className="size-5" />
            <span className="sr-only">В корзину</span>
          </Button>
        }
        />
        <TooltipContent>В корзину</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="mx-1 w-px h-8" />
      <Tooltip>
        <TooltipTrigger render={
          <Button variant="ghost" size="icon" onClick={() => clear()}>
            <XIcon className="size-5" />
            <span className="sr-only">Снять выбор</span>
          </Button>
        }
        />
        <TooltipContent>Снять выбор</TooltipContent>
      </Tooltip>
    </div>
  )
}
