import { OptionalVideoProvider } from "@/components/video-provider"
import { getAttachment } from "@/lib/api/attachments"
import { toBlurDataURL } from "@/lib/blurhash"
import { getRefSrc } from "@/lib/ref-src"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ExternalLinkIcon, Link2Icon, PlusIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import Link from "next/link"
import { notFound } from "next/navigation"
import RefContent from "../components/ref-content"
import AttachmentActions from "./components/attachment-actions"
import CollectionsSelect from "./components/collections-select"
import Header from "./components/header"
import NewTags from "./components/tags/new-tags"


type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    hideTitle?: string
    hideBlurhash?: string
    fill?: string
  }>
}
export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  const { hideTitle = "false", hideBlurhash = "false", fill = "false" } = await searchParams

  const attachment = await getAttachment(id)
  if (!attachment?.src) return notFound()

  const refSrc = getRefSrc(attachment.src)
  if (!refSrc) return notFound()

  const title = attachment.label || refSrc || "-"
  const attachmentTags = attachment.tags || [];
  const tags = attachmentTags.map(tag => tag.tag)

  return (
    <div className="relative isolate @container">
      {
        attachment.blurhash && hideBlurhash === "false" &&
        <div
          className="absolute inset-0 -z-20 size-full overflow-clip"
        >
          <div
            style={{
              backgroundImage: `url(${toBlurDataURL(attachment.blurhash)})`
            }}
            className="absolute bg-no-repeat inset-0 size-full bg-cover bg-top-left dark:opacity-100 opacity-25 blur-3xl"
          />
          <div className="absolute inset-0 size-full bg-linear-to-tr from-transparent to-background" />
          <div className="absolute inset-0 size-full bg-linear-to-bl from-transparent to-background" />
        </div>
      }
      {/*<RefHeader />*/}
      <Header id={id} />
      <div className={cn("w-full min-h-dvh", "flex gap-6 lg:flex-row flex-col")}>
        <div className="size-full flex max-w-7xl flex-col">
          <OptionalVideoProvider duration={attachment.duration_ms}>
            <div className="h-fit w-full md:px-12 px-4 flex items-center justify-center">
              <AnimatePresence>
                <RefContent
                  id={attachment.id}
                  src={refSrc}
                  mimeType={attachment.mime_type}
                  blurhash={attachment.blurhash}
                  alt={title}
                  className="rounded-sm [&_img]:rounded-sm [&_video]:rounded-sm"
                  style={{
                    aspectRatio: `${attachment.width}/${attachment.height}`
                  }}
                  sizes="100vw"
                />
              </AnimatePresence>
            </div>
          </OptionalVideoProvider>
        </div>
        <div className="w-full md:px-12 px-4 mx-auto lg:max-w-md max-w-full space-y-6">
          <div className="flex min-w-0 flex-col gap-3">
            {
              hideTitle === "false" &&
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h1 className="md:text-4xl text-xl font-medium line-clamp-1">
                  {title}
                </h1>
                {
                  !attachment.source && <span className="text-muted-foreground">—</span>
                }
                {
                  attachment.source &&
                  <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden">
                    <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden">
                      <Avatar className="size-4">
                        <AvatarImage src={attachment.source.domain.favicon_url || undefined} />
                        <AvatarFallback>
                          <Link2Icon />
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate">
                        {
                          attachment.source.domain.name
                            ? attachment.source.domain.name
                            : attachment.source?.domain + attachment.source.domain?.slug
                        }
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      nativeButton={false}
                      render={<Link target="_blank" href={new URL(attachment.source.domain.slug, `https://${attachment.source.domain.domain}`).toString()} />}
                    >
                      <ExternalLinkIcon />
                    </Button>
                  </div>
                }
              </div>
            }
            <div className="flex shrink-0 w-fit gap-2 items-center">
              <CollectionsSelect
                attachmentId={attachment.id}
                collectionIds={attachment.collection_ids ?? []}
                className="w-full"
              />
              <AttachmentActions attachment={attachment} />
            </div>
          </div>
          <div className="flex items-start gap-1 flex-wrap">
            <NewTags attachmentId={id} initialTags={tags}>
              <Button variant="outline" size="icon-lg" className="size-[34px] rounded-md">
                <span className="sr-only">Добавить тэг</span>
                <PlusIcon />
              </Button>
            </NewTags>
            {tags.length === 0 && <span className="text-muted-foreground h-8">—</span>}
            {
              tags.map(tag => {
                return <Badge key={tag.id} variant="outline" className="text-base py-1 bg-background uppercase h-fit">{tag.name}</Badge>
              })
            }
          </div>
        </div>
      </div>
    </div >
  )
}
