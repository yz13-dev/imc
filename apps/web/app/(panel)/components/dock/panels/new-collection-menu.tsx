"use client"
import { createCollection } from "@/lib/api/collections"
import { useUser } from "@/lib/stores/user"
import { useHotkey } from "@tanstack/react-hotkeys"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { SquareLibraryIcon } from "lucide-react"
import { useState } from "react"
import { useDockPanel } from "../panel-context"

export default function NewCollectionMenu() {
  const user = useUser(state => state.user)
  const { close } = useDockPanel()
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const disabled = !name.trim() || loading

  const create = async () => {
    if (disabled || !user) return
    setLoading(true)
    try {
      const collection = await createCollection({ name: name.trim(), description: "", user_id: user.id })
      if (collection) {
        // SSE's collections:new also triggers this, but that's a network
        // round trip away — do it immediately for instant feedback.
        queryClient.invalidateQueries({ queryKey: ["attachments", "collections"] })
        close()
      }
    } finally {
      setLoading(false)
    }
  }

  useHotkey("Escape", close)
  useHotkey("Enter", create, { enabled: !disabled })

  if (!user) return null

  return (
    <div className="dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-4xl border p-2 flex items-center gap-2">
      <InputGroup className="flex-1">
        <InputGroupAddon>
          <SquareLibraryIcon />
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          placeholder="Название коллекции"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </InputGroup>
      <Button disabled={disabled} onClick={create}>Создать</Button>
    </div>
  )
}
