"use client"
import RefContent from "@/app/(panel)/components/ref-content"
import { OptionalVideoProvider } from "@/components/video-provider"
import { toBlurDataURL } from "@/lib/blurhash"
import { resolveAssetImageUrl } from "@/lib/image-loader"
import { getAssetsProxyUrl } from "@/lib/url"
import { promoteViewTransitionGroup, withViewTransition } from "@/lib/view-transition"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { AnimatePresence } from "motion/react"
import { parseAsString, useQueryState } from "nuqs"
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
  scope?: string
  className?: string
  style?: React.CSSProperties
  preview?: boolean
  noLink?: boolean
  containerClassName?: string
  readonly?: boolean
  collectionSelector?: boolean
} & AttachmentWithMaybeTagsAndSource

export default function CollectionCard({ readonly = false, tags = [], mime_type, id, src, scope = "", className, blurhash, duration_ms, style = {}, label, source, preview = false, noLink = false, containerClassName = "", collectionSelector = false, ...rest }: CollectionCardProps) {

  const attachment: AttachmentWithMaybeTagsAndSource = { tags, id, src, mime_type, blurhash, duration_ms, label, source, ...rest }
  const href = scope ? `/${scope}/${id}` : `/${id}`

  const cardTags = tags ?? []

  const isVideo = mime_type.startsWith("video/")
  const isGif = mime_type.startsWith("image/gif")

  const queryClient = useQueryClient()
  const [activeAttachmentId, setActiveAttachmentId] = useQueryState("attachment", parseAsString)
  const isActive = activeAttachmentId === id

  // Seed the preview's query cache synchronously from data the grid already has,
  // so opening never races the view transition against a network fetch.
  const seedPreviewCache = () => {
    queryClient.setQueryData(["attachments", "ref", id], {
      ...rest,
      id,
      src,
      mime_type,
      blurhash,
      duration_ms,
      label,
      source,
      tags: cardTags,
    })
  }

  // The preview mounts a brand new <img>. If it hasn't decoded yet when the
  // view transition captures its "after" state, the browser has nothing to
  // morph into and the transition silently no-ops (or flashes a placeholder).
  // preview/attachment.tsx always requests quality=100 (gifs go through
  // unoptimized, so they keep the bare URL) — resolve the same URL here so
  // this actually warms the cache entry the preview's <Image> will use,
  // rather than a differently-sized/qualified variant of the same asset.
  const preloadMedia = async () => {
    if (isVideo || typeof window === "undefined") return
    const rawUrl = getAssetsProxyUrl(`/${id}`)
    const img = new window.Image()
    img.src = isGif ? rawUrl : resolveAssetImageUrl(rawUrl, 100)
    try {
      await Promise.race([
        img.decode(),
        new Promise((_, reject) => setTimeout(reject, 800)),
      ])
    } catch {
      // Ignore decode/network/timeout failures — worst case the transition no-ops.
    }
  }
  const openPreview = async () => {
    await preloadMedia()
    // Every card in the grid carries a view-transition-name (so any of them
    // can be a future transition source), which means this specific card's
    // group would otherwise stack in plain DOM order among all the others —
    // visually underneath later siblings while its box still overlaps them.
    // Force it to the front for just this transition.
    const unpromote = promoteViewTransitionGroup(`attachment-${id}`)
    const transition = withViewTransition(() => setActiveAttachmentId(id))
    if (transition) {
      transition.finished.finally(unpromote)
    } else {
      unpromote()
    }
  }


  return (
    <div className="flex flex-col group">
      <CardContextMenu
        attachmentId={id}
        label={label}
        readonly={readonly}
        className={cn(
          "w-full p-1 bg-muted rounded-lg relative break-inside-avoid",
          activeAttachmentId ? "-z-10" : "data-popup-open:z-50 z-auto",
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
                viewTransitionName={!isActive ? `attachment-${id}` : undefined}
                // Mirrors the @sm..@7xl column counts in CardGridWrapper, offset
                // by the fixed sidebar + page padding (~320px) so next/image
                // doesn't fetch a full-viewport-wide image for a grid thumbnail.
                sizes="(min-width: 1600px) calc((100vw - 320px) / 6), (min-width: 1344px) calc((100vw - 320px) / 5), (min-width: 1216px) calc((100vw - 320px) / 4), (min-width: 896px) calc((100vw - 320px) / 3), (min-width: 704px) calc((100vw - 320px) / 2), 100vw"
              >
                {
                  !noLink &&
                  <div
                    className="absolute inset-0 z-10"
                    onClick={preview ? (e) => {
                      e.preventDefault()
                      // CardContextMenu's DropdownMenuTrigger wraps this whole
                      // card and reacts to this same click bubbling up to it
                      // (calls preventBaseUIHandler()) — claim the click here
                      // so it never reaches that handler.
                      e.stopPropagation()
                      seedPreviewCache()
                      openPreview()
                    } : undefined}
                  />
                }
                <CardHeader attachment={attachment} collectionSelector={collectionSelector} />
                <CardFooter duration_ms={duration_ms} href={href} source={source} label={label} />
              </RefContent>
            </AnimatePresence>
            <div className="p-2 hidden">
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          </OptionalVideoProvider>
        </div>
      </CardContextMenu>
      <div className="flex px-2 items-center py-1.5 gap-2">
        <span className="text-sm line-clamp-1">{label}</span>
      </div>
    </div>
  )
}
