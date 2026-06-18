import { getAttachment } from "@/lib/api/attachments"
import { getRefSrc } from "@/lib/ref-src"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Link2Icon } from "lucide-react"
import { notFound } from "next/navigation"
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

  return (
    <>
      <div className="w-full h-svh">
        <div className="size-full flex flex-row">
          <div className="h-full w-2/3 md:p-12 p-4 flex items-center justify-center">
            <div className="w-full aspect-video bg-muted rounded-2xl">
              <RefContent
                src={refSrc}
                mimeType={attachment.mime_type}
              />
            </div>
          </div>
          <div className="h-full w-1/3 md:p-12 p-4">
            <div className="size-full space-y-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-medium">
                  {title}
                </h1>
                <div className="flex text-base items-center gap-2">
                  <span className="text-muted-foreground">
                    Автор
                  </span>
                  <span className="font-medium">
                    yz13
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted/25 border rounded-2xl py-3 space-y-3">
                <div className="px-3 flex flex-col gap-1.5">
                  <span className="uppercase text-sm text-muted-foreground">
                    Тэги
                  </span>
                  <div className="flex items-start gap-1 flex-wrap">
                    <Badge variant="outline" className="text-base py-1 h-fit">UI</Badge>
                    <Badge variant="outline" className="text-base py-1 h-fit">Website</Badge>
                  </div>
                </div>
                <div className="px-3 flex flex-col gap-1.5">
                  <span className="uppercase text-sm text-muted-foreground">
                    Источник
                  </span>
                  <Button className="justify-start w-fit" variant="secondary">
                    <Link2Icon />
                    <span>example.com/shot/id</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
