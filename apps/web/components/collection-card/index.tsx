"use client"
import RefContent from "@/app/(panel)/components/ref-content"
import { OptionalVideoProvider } from "@/components/video-provider"
import { toBlurDataURL } from "@/lib/blurhash"
import { getAssetsProxyUrl } from "@/lib/url"
import { attachmentPath } from "@/lib/routes"
import { restoreAttachment } from "@/lib/api/attachments"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { DownloadIcon, EllipsisIcon, RotateCcwIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CardContextMenu from "./card-context-menu"
import CardFooter from "./card-footer"
import CardHeader from "./card-header"


export type CollectionCardSkeletonProps = {
  className?: string
  containerClassName?: string
  style?: React.CSSProperties
}
export function CollectionCardSkeleton({ className = "", containerClassName = "", style = {} }: CollectionCardSkeletonProps) {

  return (
    <div
      className={cn(
        "w-full p-2 bg-muted rounded-sm",
        "group w-full break-inside-avoid",
        containerClassName
      )}
    >
      <div className="w-full flex justify-center pb-2">
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div>
        <Skeleton
          className={className}
          style={style}
        />
      </div>
    </div>
  )
}

export type CollectionCardProps = {
  visibility?: "private" | "public"
  className?: string
  style?: React.CSSProperties
  noLink?: boolean
  containerClassName?: string
  readonly?: boolean
  collectionSelector?: boolean
  inTrash?: boolean
} & AttachmentWithMaybeTagsAndSource

export default function CollectionCard({ readonly = false, tags = [], mime_type, id, src, visibility = "private", className, blurhash, duration_ms, style = {}, label, source, noLink = false, containerClassName = "", collectionSelector = false, inTrash = false, ...rest }: CollectionCardProps) {

  const attachment: AttachmentWithMaybeTagsAndSource = { tags, id, src, mime_type, blurhash, duration_ms, label, source, ...rest }
  const href = attachmentPath(id, visibility)

  const cardTags = tags ?? []

  const isVideo = mime_type.startsWith("video/")
  const router = useRouter()

  const downloadAttachment = async () => {
    try {
      const resolvedId = id // getRefSrc(src) || src;
      const refSrc = getAssetsProxyUrl(`/${resolvedId || src}`)
      const response = await fetch(refSrc)

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = label || "attachment"
      link.click()

      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error(error)
    }
  }

  const restore = async () => {
    await restoreAttachment(id)
    router.refresh()
  }


  return (
    <div className="flex flex-col group break-inside-avoid">
      <CardContextMenu
        attachmentId={id}
        label={label}
        readonly={readonly || inTrash}
        className={cn(
          "w-full p-1 bg-muted rounded-lg relative",
          "data-popup-open:z-50 z-auto",
          containerClassName
        )}
      >
        <div className="flex flex-col">
          <div className="absolute inset-0 size-full rounded-lg overflow-clip">
            <div
              className="absolute inset-0 size-full rounded-lg blur-xs bg-no-repeat bg-cover bg-center"
              style={{
                backgroundImage: blurhash ? `url(${toBlurDataURL(blurhash)})` : undefined
              }}
            />
          </div>
          <OptionalVideoProvider isVideo={isVideo} duration={duration_ms}>
            <AnimatePresence>
              <RefContent
                id={id}
                mimeType={mime_type}
                src={src}
                className={cn(
                  "outline-4 outline-transparent group/-hover:outline-foreground/10 bg/-foreground/10",
                  "group-hover:scale/-101",
                  className
                )}
                blurhash={blurhash}
                style={style}
                viewTransitionName={`attachment-${id}`}
                // Mirrors the @sm..@7xl column counts in CardGridWrapper, offset
                // by the fixed sidebar + page padding (~320px) so next/image
                // doesn't fetch a full-viewport-wide image for a grid thumbnail.
                sizes="(min-width: 1600px) calc((100vw - 320px) / 6), (min-width: 1344px) calc((100vw - 320px) / 5), (min-width: 1216px) calc((100vw - 320px) / 4), (min-width: 896px) calc((100vw - 320px) / 3), (min-width: 704px) calc((100vw - 320px) / 2), 100vw"
              >
                {
                  !noLink && !inTrash &&
                  <Link href={href} className="absolute inset-0 z-10" onClick={event => event.stopPropagation()} />
                }
                <CardHeader attachment={attachment} collectionSelector={collectionSelector} />
                <CardFooter duration_ms={duration_ms} href={inTrash ? undefined : href} source={source} label={label} />
              </RefContent>
            </AnimatePresence>
            <div className="p-2 hidden">
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          </OptionalVideoProvider>
        </div>
      </CardContextMenu>
      <div className="flex px-2 items-center justify-between py-1.5 gap-2">
        <span className="text-sm line-clamp-1">{label}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button size="icon-xs" variant="ghost"><EllipsisIcon /></Button>}
          />
          <DropdownMenuContent>
            {inTrash && <DropdownMenuItem onClick={restore}><RotateCcwIcon /><span>Восстановить</span></DropdownMenuItem>}
            <DropdownMenuItem onClick={downloadAttachment}><DownloadIcon /><span>Скачать файл</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
