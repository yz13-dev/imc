import { getAttachment } from "@/lib/api/attachments"
import { getRefSrc } from "@/lib/ref-src"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup, ButtonGroupSeparator } from "@workspace/ui/components/button-group"
import { ExternalLinkIcon, Link2Icon, PlusIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "../../components/header"
import RefContent from "../../components/ref-content"


type PageProps = {
  params: Promise<{
    refId: string
  }>
}
export default async function Page({ params }: PageProps) {
  const { refId } = await params

  const attachment = await getAttachment(refId)
  console.log("attachment", attachment)
  if (!attachment) return notFound()

  const refSrc = getRefSrc(attachment.src)
  if (!refSrc) return notFound()

  const title = attachment.label || refSrc || "-"
  const tags = attachment.tags || [];

  return (
    <>
      <Header />
      <div className="w-full min-h-svh">
        <div className="size-full flex lg:flex-row flex-col">
          <div className="h-fit xl:w-2/3 lg:w-1/2 w-full md:p-12 p-4 flex items-center justify-center">
            <AnimatePresence>
              <RefContent
                src={refSrc}
                mimeType={attachment.mime_type}
                blurhash={attachment.blurhash}
                alt={title}
                className="rounded-sm [&_img]:rounded-sm [&_video]:rounded-sm"
                style={{
                  aspectRatio: `${attachment.width}/${attachment.height}`
                }}
              />
            </AnimatePresence>
          </div>
          <div className="h-full xl:w-1/3 lg:w-1/2 w-full sticky lg:top-14 bottom-0 md:p-12 p-4 bg-linear-to-b from-transparent to-background">
            <div className="w-full space-y-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-medium">
                  {title}
                </h1>
                <div className="hidden text-base items-center gap-2">
                  <span className="text-muted-foreground">
                    Автор
                  </span>
                  <span className="font-medium">
                    yz13
                  </span>
                </div>
              </div>
              <div className="w-full bg-card border rounded-2xl py-3 space-y-3">
                <div className="px-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="capitalize text-base text-muted-foreground">
                      Тэги
                    </span>
                    <Button variant="secondary" size="xs"><span>Добавить</span><PlusIcon /></Button>
                  </div>
                  <div className="flex items-start gap-1 flex-wrap">
                    {tags.length === 0 && <span className="text-muted-foreground h-8">—</span>}
                    {
                      tags.map(tag => {

                        return <Badge key={tag.tag_id} variant="outline" className="text-base py-1 uppercase h-fit">{tag.tag.name}</Badge>
                      })
                    }
                  </div>
                </div>
                <div className="px-3 flex flex-col gap-1.5">
                  <span className="capitalize text-base text-muted-foreground">
                    Источник
                  </span>
                  {
                    !attachment.source && <span className="text-muted-foreground">—</span>
                  }
                  {
                    attachment.source &&
                    <ButtonGroup className="shrink w-full">
                      <Button className="justify-start w-full shrink overflow-hidden" variant="secondary">
                        <Avatar className="size-4">
                          <AvatarImage src={attachment.source.domain.favicon_url || undefined} />
                          <AvatarFallback>
                            <Link2Icon />
                          </AvatarFallback>
                        </Avatar>
                        <span className="line-clamp-1">
                          {
                            attachment.source.domain.name
                              ? attachment.source.domain.name
                              : attachment.source?.domain + attachment.source.domain?.slug
                          }
                        </span>
                      </Button>
                      <ButtonGroupSeparator />
                      <Button
                        variant="secondary"
                        size="icon"
                        nativeButton={false}
                        render={<Link target="_blank" href={new URL(attachment.source.domain.slug, `https://${attachment.source.domain.domain}`).toString()} />}
                      >
                        <ExternalLinkIcon />
                      </Button>
                    </ButtonGroup>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
