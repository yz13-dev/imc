"use client"
import type { Tag } from "@/types/attachments";
import type { Button } from "@workspace/ui/components/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { useState } from "react";



type NewTagsProps = {
  children: React.ReactElement<typeof Button>;
}

export default function NewTags({ children }: NewTagsProps) {

  const [tag, setTag] = useState("")

  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Тэги</DialogTitle>
          <DialogDescription>Укажите тэги</DialogDescription>
        </DialogHeader>
        <Command className="p-0">
          <CommandInput placeholder="Начните вводить..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandList>
        </Command>

      </DialogContent>
    </Dialog>
  )
}
