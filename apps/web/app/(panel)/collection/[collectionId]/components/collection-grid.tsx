"use client"
import CardGrid from "@/app/(panel)/components/card-grid"
import CardGridSkeleton from "@/app/(panel)/components/card-grid-skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { getCollectionAttachments, getPublicCollectionAttachments, type Page } from "@/lib/api/attachments"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import type { InfiniteData, QueryKey } from "@tanstack/react-query"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "motion/react"
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import { useEffect, useRef, useState } from "react"

type CollectionGridProps = {
  collection: string
  initialPage: Page<AttachmentWithMaybeTagsAndSource>
  initialTags?: string[]
  readonly?: boolean
}

export default function CollectionGrid({ collection, initialPage, initialTags = [], readonly = false }: CollectionGridProps) {
  const [tagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))
  const tags = tagQuery ?? []
  const queryKey = readonly
    ? ["public", "attachments", "collections", collection, tags]
    : ["attachments", "collections", collection, tags]
  const hasMatchingInitialTags = tags.length === initialTags.length && tags.every((tag, index) => tag === initialTags[index])
  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery<Page<AttachmentWithMaybeTagsAndSource>, Error, InfiniteData<Page<AttachmentWithMaybeTagsAndSource>, string | null>, QueryKey, string | null>({
    initialPageParam: null,
    queryKey,
    queryFn: async ({ pageParam }) => {
      const query = { cursor: pageParam, limit: 25, tags }
      const attachments = readonly
        ? await getPublicCollectionAttachments(collection, query)
        : await getCollectionAttachments(collection, query)
      return attachments || { items: [], next_cursor: "" }
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    initialData: hasMatchingInitialTags
      ? { pages: [initialPage], pageParams: [null] }
      : undefined,
  })
  const attachments = data?.pages.flatMap(page => page.items) ?? []
  const ref = useRef(null)
  const inView = useInView(ref, { margin: "0px 0px 100% 0px" })
  const [disabled, setDisabled] = useState(true)
  const debouncedInView = useDebounce(inView, 25)

  useEffect(() => { if (attachments.length) setDisabled(false) }, [attachments.length])
  useEffect(() => {
    if (!disabled && debouncedInView && hasNextPage) void fetchNextPage()
  }, [debouncedInView, disabled, fetchNextPage, hasNextPage])

  if (isLoading) return <CardGridSkeleton />
  if (attachments.length === 0) return (
    <div className="flex min-h-64 items-center justify-center px-6 text-center text-muted-foreground">
      {tags.length ? "В коллекции нет материалов с выбранными тегами" : "В этой коллекции пока нет материалов"}
    </div>
  )
  return <>
    <CardGrid attachments={attachments} visibility={readonly ? "public" : "private"} readonly={readonly} />
    <div ref={ref} className="w-full py-6" />
  </>
}
