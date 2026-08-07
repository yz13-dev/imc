import { OptionalVideoProvider } from "@/components/video-provider"
import { getCollectionAttachments } from "@/lib/api/attachments"
import { useUser } from "@/lib/stores/user"
import { Collection } from "@/types/collections"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowUpRightIcon } from "lucide-react"
import Link from "next/link"
import RefContent from "../../components/ref-content"

export function CollectionCardSkeleton() {
  return (
    <Skeleton className="size-48 aspect-video shrink-0 rounded-xl relative" />
  )
}

type CollectionCardProps = {
  collection: Collection
}
export default function CollectionCard({ collection }: CollectionCardProps) {

  const user = useUser((state) => state.user)
  const { data, isLoading } = useSuspenseQuery({
    queryKey: ["attachments", "collections", collection.id],
    queryFn: () => getCollectionAttachments(collection.id)
  })
  const attachments = (data || []).slice(0, 3)
  const href = `/${user?.username}/${collection?.id}`

  if (isLoading) return <CollectionCardSkeleton />
  return (
    <div className="max-w-48 aspect-video w-full rounded-xl overflow-clip p-1 bg-muted relative">
      {/*
        user &&
        <Link href={href} className="absolute z-10 inset-0" />
      */}
      <div className="w-full">
        <div className="w-full aspect-square relative gap-1 grid grid-cols-2 grid-rows-2 *:h-full">
          {
            attachments
              .toSorted((a, b) => {
                if (a.mime_type.startsWith("video/") && b.mime_type.startsWith("image/")) return 1
                if (a.mime_type.startsWith("image/") && b.mime_type.startsWith("video/")) return -1
                return 0
              })
              .map((item, index) => {
                const isLast = index === attachments.length - 1
                return (
                  <OptionalVideoProvider key={item.id} duration={item.duration_ms}>
                    <RefContent
                      mimeType={item.mime_type}
                      className={cn(
                        "nth-[1]:hover:rotate-6 nth-[2]:hover:-rotate-6 nth-[3]:hover:rotate-3 will-change-transform transition-transform",
                        isLast && "col-span-full"
                      )}
                      // Fixed 2-col grid inside a max-w-48 (192px) tile.
                      sizes={isLast ? "192px" : "96px"}
                      quality={25}
                      {...item}
                    />
                  </OptionalVideoProvider>
                )
              })
          }
        </div>
      </div>
      <div className="absolute bottom-4 left-0 px-4 z-10 w-full flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <Badge className="h-6 bg-foreground/50 border-foreground/50 text-background backdrop-blur-3xl">
            {collection.name}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge className="h-6 bg-foreground/50 border-foreground/50 text-background backdrop-blur-3xl">
            {attachments.length}
          </Badge>
          {
            user &&
            <Button size="icon-xs" className="bg-foreground/50 border-foreground/50 text-background backdrop-blur-md" nativeButton={false} render={<Link href={href} />}>
              <ArrowUpRightIcon />
            </Button>
          }
        </div>
      </div>
      <div className="py-2 hidden w-full flex flex-col gap-y-1">
        <span className="text-sm">{collection.name}</span>
        <span className="text-xs text-muted-foreground">
          {attachments.length} файл{attachments.length !== 1 ? 'а' : ''}
        </span>
      </div>
    </div>
  )
}
