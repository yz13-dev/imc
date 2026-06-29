"use client"
import RefContent from "@/app/(panel)/components/ref-content"
import { OptionalVideoProvider } from "@/components/video-provider"
import { toBlurDataURL } from "@/lib/blurhash"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { AnimatePresence } from "motion/react"
import Link from "next/link"
import CardContextMenu from "./card-context-menu"
import CardFooter from "./card-footer"


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
} & AttachmentWithMaybeTagsAndSource

export default function CollectionCard({ readonly = false, tags = [], mime_type, id, src, scope = "", className, blurhash, duration_ms, style = {}, label, source, preview = false, noLink = false, containerClassName = "" }: CollectionCardProps) {

  const href = scope ? `/${scope}/${id}` : `/${id}`

  const cardTags = tags ?? []

  const isVideo = mime_type.startsWith("video/")


  return (
    <CardContextMenu
      attachmentId={id}
      label={label}
      readonly={readonly}
      className={cn(
        "w-full p-1 bg-muted rounded-lg relative group break-inside-avoid",
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
          {/*<div className="w-full flex justify-center pb-2"></div>*/}
          <AnimatePresence>
            <RefContent
              id={id}
              mimeType={mime_type}
              src={src}
              className={cn(
                "outline-4 outline-transparent group/-hover:outline-foreground/10 bg/-foreground/10",
                "group-hover:scale/-101 will-change-transform transition-all",
                className
              )}
              blurhash={blurhash}
              style={style}
            >
              {
                !noLink &&
                <Link href={preview ? `?attachment=${id}` : href} className="absolute inset-0 z-10" />
              }

              <CardFooter duration_ms={duration_ms} href={href} source={source} tags={cardTags} label={label} />
            </RefContent>
          </AnimatePresence>
          <div className="p-2 hidden">
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        </OptionalVideoProvider>
      </div>
    </CardContextMenu>
  )
}
