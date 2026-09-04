"use client"

import { getAttachment } from "@/lib/api/attachments"
import { downloadAttachment } from "@/lib/download-attachment"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { DownloadIcon } from "lucide-react"

type HeaderProps = {
  id: string
}

export default function Header({ id }: HeaderProps) {
  const { data: attachment, isPending } = useQuery({
    queryKey: ["attachment", id],
    queryFn: () => getAttachment(id),
  })

  return (
    <header className="w-full md:px-12 px-4 flex items-center justify-between h-14">
      <div className="flex items-center gap-2"></div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          aria-label="Скачать файл"
          disabled={isPending || !attachment}
          onClick={() => attachment && downloadAttachment(id, attachment.label)}>
          <DownloadIcon />
          <span className="md:inline hidden">Скачать файл</span>
        </Button>
      </div>
    </header>
  )
}
