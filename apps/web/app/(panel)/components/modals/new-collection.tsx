"use client"
import { createCollection } from "@/lib/api/collections"
import { useUser } from "@/lib/stores/user"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { SquareLibraryIcon } from "lucide-react"
import { useState } from "react"

export default function NewCollectionModal({ children }: { children: React.ComponentPropsWithoutRef<typeof DialogTrigger>["render"] }) {

  const user = useUser(state => state.user);
  const [name, setName] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const [open, setOpen] = useState<boolean>(false)

  const disabled = !name || name.length < 3 || loading;

  const action = async () => {
    if (disabled) return;
    if (!user) return;
    setLoading(true)
    try {

      const collection = await createCollection({ name, description: "", user_id: user.id })

      if (collection) {
        setOpen(false)
      }

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая коллекция</DialogTitle>
          <DialogDescription>Достаточно названия, заполнить можно позже</DialogDescription>
        </DialogHeader>
        <div className="py-0">
          <InputGroup>
            <InputGroupAddon>
              <SquareLibraryIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Название коллекции"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </InputGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={disabled} onClick={action}>Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
