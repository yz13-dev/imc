"use client"
import { useDebounce } from "@/hooks/use-debounce";
import { connectTag, createTag, getSearchTags } from "@/lib/api/tags";
import type { Tag } from "@/types/attachments";
import { Button } from "@workspace/ui/components/button";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Spinner } from "@workspace/ui/components/spinner";
import { LoaderIcon, TagIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";



type NewTagsProps = {
  children: React.ReactElement<typeof Button>;
  attachmentId: string;
  initialTags?: Tag[];
}

export default function NewTags({ children, attachmentId, initialTags: initialTagsProp = [] }: NewTagsProps) {
  const [open, setOpen] = useState<boolean>(false)

  const [tag, setTag] = useState("")

  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const [initialTags, setInitialTags] = useState<Tag[]>(initialTagsProp)
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTagsProp)

  const hasChanges = useMemo(() => {
    return JSON.stringify(selectedTags) !== JSON.stringify(initialTags)
  }, [selectedTags, initialTags])

  const disabled = loading || !hasChanges;

  const connectTags = async (tags: Tag[]) => {
    setLoading(true)
    for (const tag of tags) {
      await connectTag(attachmentId, tag.id)
    }
    setLoading(false)
    //
    setInitialTags(tags)
    setSelectedTags(tags)
    setOpen(false)
  }

  const selectTag = (tagName: string) => {

    const isSelected = selectedTags.some(t => t.name === tagName)
    if (isSelected) return

    const tag = suggestedTags.find(t => t.name === tagName)
    if (tag) setSelectedTags([...selectedTags, tag])
  }

  const createNewTag = async (tag: string) => {
    if (!tag) return;
    setLoading(true)

    const tagData = await createTag(tag)
    if (tagData) setSelectedTags([...selectedTags, tagData])

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Тэги</DialogTitle>
          <DialogDescription>Укажите тэги</DialogDescription>
        </DialogHeader>
        <div className="w-full flex items-start gap-1">
          {selectedTags.map(tag => (
            <ButtonGroup key={tag.id}>
              <Button size="xs">
                {tag.name}
              </Button>
              <Button size="icon-xs">
                <XIcon />
              </Button>
            </ButtonGroup>
          ))}
        </div>
        <Command
          className="p-0 rounded-none"
          onValueChange={(value) => {
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
                (!loading || tag !== "") &&
                <Button className="w-fit" onClick={() => createNewTag(tag)} disabled={loading}>
                  {loading && <LoaderIcon />}
                  <span>Создать новый</span>
                </Button>
              }
            </CommandEmpty>
            {
              suggestedTags.map(tag => {
                return (
                  <CommandItem key={tag.id} value={tag.name} onSelect={value => selectTag(value)}>
                    <TagIcon />
                    <span>{tag.name}</span>
                  </CommandItem>
                )
              })
            }
          </CommandList>
        </Command>

        <DialogFooter>
          <Button disabled={disabled} onClick={() => connectTags(selectedTags)}>
            {loading && <Spinner />}
            <span>Сохранить</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
