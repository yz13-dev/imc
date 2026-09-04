import CollectionGrid from "@/app/(panel)/collection/[collectionId]/components/collection-grid"
import Header, { HeaderContent } from "@/app/(panel)/components/header"
import TagPicker from "@/app/(panel)/components/tag-picker"
import { TagFilters } from "@/app/(panel)/components/tags-stats"
import { getPublicCollectionAttachments } from "@/lib/api/attachments"
import { getPublicCollection } from "@/lib/api/collections"
import { getPublicCollectionTags } from "@/lib/api/tags"
import { Badge } from "@workspace/ui/components/badge"
import { ImcIcon } from "@workspace/ui/components/logo/imc"
import { notFound } from "next/navigation"
import { parseAsArrayOf, parseAsString } from "nuqs/server"

type PageProps = {
  params: Promise<{ collectionId: string }>
  searchParams: Promise<{ tags?: string | string[] }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { collectionId } = await params
  const { tags: rawTags } = await searchParams
  const selectedTags = parseAsArrayOf(parseAsString).parseServerSide(rawTags) ?? []
  const [collection, tags, initialPage] = await Promise.all([
    getPublicCollection(collectionId),
    getPublicCollectionTags(collectionId),
    getPublicCollectionAttachments(collectionId, { limit: 25, tags: selectedTags }),
  ])

  if (!collection) notFound()

  return (
    <>
      <Header style={{ "--header-section-min-width": "125px" } as React.CSSProperties} className="gap-3">
        <HeaderContent className="justify-start">
          <ImcIcon className="size-6" />
        </HeaderContent>
        <HeaderContent className="min-w-0 flex-1 justify-start">
          <h1 className="truncate text-lg font-medium">{collection.name || "Без названия"}</h1>
        </HeaderContent>
        <HeaderContent className="justify-end md:min-w-(--header-section-min-width)">
          <Badge variant="outline">Публичная</Badge>
        </HeaderContent>
      </Header>

      <TagPicker className="sticky top-14">
        <div className="flex w-full items-center gap-2">
          <TagFilters tags={tags || []} />
        </div>
      </TagPicker>

      <div className="w-full px-6 pt-6">
        <CollectionGrid
          readonly
          collection={collectionId}
          initialPage={initialPage ?? { items: [], next_cursor: "" }}
          initialTags={selectedTags}
        />
      </div>
      <footer className="p-6" />
    </>
  )
}
