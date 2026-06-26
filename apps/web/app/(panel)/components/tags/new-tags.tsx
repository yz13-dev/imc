"use client"
import { useDebounce } from "@/hooks/use-debounce";
import { createTag, getSearchTags } from "@/lib/api/tags";
import type { Tag } from "@/types/attachments";
import { Button } from "@workspace/ui/components/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";



type NewTagsProps = {
  children: React.ReactElement<typeof Button>;
}

export default function NewTags({ children }: NewTagsProps) {

  const [tag, setTag] = useState("")

  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState<boolean>(false)


  const createNewTag = async (tag: string) => {
    if (!tag) return;
    setLoading(true)
    await createTag(tag)
    setTag("")
    setLoading(false)
  }

  const search = async (tag: string) => {
    if (!tag) return;
    const tags = await getSearchTags(tag)
    if (tags !== null) setSuggestedTags(tags)
  }

  const debouncedTag = useDebounce(tag, 250)
  useEffect(() => {
    if (!debouncedTag) return;
    search(debouncedTag)
  }, [debouncedTag])

  console.log(tag, debouncedTag, suggestedTags)
  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Тэги</DialogTitle>
          <DialogDescription>Укажите тэги</DialogDescription>
        </DialogHeader>
        <Command
          className="p-0"
          onSelect={(value) => {
            console.log("selected", value)
          }}
        >
          <CommandInput
            placeholder="Начните вводить..."
            className="w-full"
            value={tag}
            onValueChange={(value) => setTag(value)}
          />
          <CommandList>
            <CommandEmpty className="flex justify-center items-center flex-col gap-6">
              <span className="text-sm text-balance text-muted-foreground">
                Похожих тэгов не найдено.
              </span>
              {
                tag !== "" &&
                <Button className="w-fit" onClick={() => createNewTag(tag)} disabled={loading}>
                  {loading && <LoaderIcon />}
                  <span>Создать новый</span>
                </Button>
              }
            </CommandEmpty>
            {
              suggestedTags.map(tag => {
                return (
                  <CommandItem key={tag.id} value={tag.name}>{tag.name}</CommandItem>
                )
              })
            }
          </CommandList>
        </Command>

      </DialogContent>
    </Dialog>
  )
}
