"use client"

import { updateAttachment } from "@/lib/api/attachments";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Spinner } from "@workspace/ui/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";



type UpdateModalProps = {
  children: React.ReactElement<typeof Button>;
  attachment: AttachmentWithMaybeTagsAndSource;
}
export default function UpdateModal({ attachment, children }: UpdateModalProps) {

  const router = useRouter()
  const [open, setOpen] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(false)

  const [label, setLabel] = useState<string>(attachment.label || "")

  const disabled = attachment.label === label || !label || loading

  const update = async () => {
    if (!label) return;
    setLoading(true)
    await updateAttachment(attachment.id, { label })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование</DialogTitle>
          <DialogDescription>Измените необходимую информацию</DialogDescription>
        </DialogHeader>
        <div className="w-full space-y-1">
          <Input
            placeholder="Название"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={disabled} onClick={update}>
            {loading && <Spinner />}
            <span>Сохранить</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
