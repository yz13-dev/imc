import { OptionalVideoProvider } from "@/components/video-provider"
import { getPublicAttachment } from "@/lib/api/attachments"
import { toBlurDataURL } from "@/lib/blurhash"
import { getRefSrc } from "@/lib/ref-src"
import RefContent from "@/app/(panel)/components/ref-content"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ExternalLinkIcon, GlobeIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const attachment = await getPublicAttachment(id)
  if (!attachment?.src) notFound()

  const src = getRefSrc(attachment.src) || attachment.src
  const title = attachment.label || "Без названия"
  const tags = attachment.tags?.map(item => item.tag).filter(Boolean) ?? []
  const sourceDomain = attachment.source?.domain
  const sourceUrl = sourceDomain ? new URL(sourceDomain.slug, `https://${sourceDomain.domain}`).toString() : null

  return (
    <div className="relative min-h-svh">
      {attachment.blurhash && <div className="absolute inset-0 -z-10 overflow-hidden opacity-25 blur-3xl" style={{ backgroundImage: `url(${toBlurDataURL(attachment.blurhash)})`, backgroundSize: "cover" }} />}
      <div className="min-h-svh flex flex-col lg:flex-row">
        <OptionalVideoProvider duration={attachment.duration_ms}>
          <div className="w-full lg:w-2/3 p-4 md:p-12 flex items-center justify-center">
            <RefContent
              id={attachment.id}
              src={src}
              mimeType={attachment.mime_type}
              blurhash={attachment.blurhash}
              alt={title}
              className="rounded-sm [&_img]:rounded-sm [&_video]:rounded-sm"
              style={{ aspectRatio: `${attachment.width}/${attachment.height}` }}
              sizes="(min-width: 1024px) 67vw, 100vw"
            />
          </div>
        </OptionalVideoProvider>
        <div className="w-full lg:w-1/3 p-4 md:p-12 flex items-start">
          <div className="w-full max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl md:text-4xl font-medium line-clamp-2">{title}</h1>
            <div className="w-full bg-card border rounded-2xl py-3 space-y-4">
              <div className="px-3 space-y-2">
                <span className="text-sm text-muted-foreground">Тэги</span>
                <div className="flex flex-wrap gap-1">
                  {tags.length ? tags.map(tag => <Badge key={tag.id} variant="outline" className="text-base py-1 uppercase h-fit">{tag.name}</Badge>) : <span className="text-muted-foreground">—</span>}
                </div>
              </div>
              <div className="px-3 space-y-2">
                <span className="text-sm text-muted-foreground">Источник</span>
                {sourceUrl && sourceDomain ? <Button variant="secondary" className="w-full justify-start" nativeButton={false} render={<Link href={sourceUrl} target="_blank" />}><Avatar className="size-4"><AvatarImage src={sourceDomain.favicon_url || undefined} /><AvatarFallback><GlobeIcon /></AvatarFallback></Avatar><span className="truncate">{sourceDomain.name || sourceDomain.domain}</span><ExternalLinkIcon className="ml-auto" /></Button> : <span className="text-muted-foreground">—</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
