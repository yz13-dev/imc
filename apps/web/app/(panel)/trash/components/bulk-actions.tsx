"use client"
import { permanentlyDeleteAttachment, restoreAttachment } from "@/lib/api/attachments"
import { useSelection } from "@/lib/stores/selection-store"
import { useHotkey } from "@tanstack/react-hotkeys"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { RotateCcwIcon, Trash2Icon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useDockPanel } from "../../components/dock/panel-context"

// Mounted once inside TrashAutoLoader — keeps the dock's shared panel slot
// in sync with the selection count, mirroring InboxSelectionDockSync.
export function TrashSelectionDockSync() {
  const count = useSelection(state => state.selectedIds.size)
  const { panel, open, close } = useDockPanel()
  const panelRef = useRef(panel)
  panelRef.current = panel

  useEffect(() => {
    if (count > 0) open("bulk-actions", <TrashBulkActionsPanel />)
    else if (panelRef.current?.id === "bulk-actions") close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  useEffect(() => () => {
    if (panelRef.current?.id === "bulk-actions") close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function TrashBulkActionsPanel() {
  const selectedIds = useSelection(state => state.selectedIds)
  const clear = useSelection(state => state.clear)
  const count = selectedIds.size
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const ids = () => Array.from(selectedIds)

  const restore = async () => {
    setBusy(true)
    try {
      await Promise.all(ids().map(id => restoreAttachment(id)))
      queryClient.invalidateQueries({ queryKey: ["attachments", "trash"] })
      queryClient.invalidateQueries({ queryKey: ["attachments", "inbox"] })
      clear()
    } finally {
      setBusy(false)
    }
  }

  const deleteForever = async () => {
    setBusy(true)
    try {
      await Promise.all(ids().map(id => permanentlyDeleteAttachment(id)))
      queryClient.invalidateQueries({ queryKey: ["attachments", "trash"] })
      clear()
    } finally {
      setBusy(false)
    }
  }

  useHotkey("Escape", () => clear())

  return (
    <div className="dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-xl border p-1 flex items-center gap-1">
      <span className="px-2 text-sm text-muted-foreground shrink-0">Выбрано: {count}</span>
      <Separator orientation="vertical" className="mx-1 w-px h-8" />
      <Button variant="ghost" size="sm" disabled={busy} onClick={restore}>
        <RotateCcwIcon />
        <span>Восстановить</span>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger render={
          <Button variant="ghost" size="sm" disabled={busy}>
            <Trash2Icon />
            <span>Удалить навсегда</span>
          </Button>
        }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить {count} {count === 1 ? "файл" : "файла(ов)"} навсегда?</AlertDialogTitle>
            <AlertDialogDescription>Это действие необратимо, файлы нельзя будет восстановить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={deleteForever}>Удалить навсегда</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Separator orientation="vertical" className="mx-1 w-px h-8" />
      <Button variant="ghost" size="icon" onClick={() => clear()}>
        <XIcon />
        <span className="sr-only">Снять выбор</span>
      </Button>
    </div>
  )
}
