"use client"
import Header, { HeaderContent } from "@/app/(panel)/components/header"
import SidebarTrigger from "@/app/(panel)/components/header/sidebar-trigger"
import CollectionCard from "@/components/collection-card"
import { OptionalVideoProvider } from "@/components/video-provider"
import { createCard } from "@/lib/api/cards"
import { createCardsAttachments } from "@/lib/api/cards-attachments"
import { getRefSrc } from "@/lib/ref-src"
import { useUser } from "@/lib/stores/user"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@workspace/ui/components/carousel"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"
import { PlusIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import AttachmentsPickOverlay from "./attachments-pick-overlay"
import { useNewCardStore } from "./new-card-store"

export default function Form() {
  const router = useRouter()

  const [loading, setLoading] = useState<boolean>(false)
  const user = useUser(state => state.user)

  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")

  const open = useNewCardStore((state) => state.openPicker)
  const setOpen = useNewCardStore((state) => state.setOpenPicker)

  const selected = useNewCardStore(state => state.attachments)

  const selectedTags = selected
    .flatMap(item => item.tags)
    .filter((tag, index, self) => self.indexOf(tag) === index)

  const disabled = loading || selected.length === 0

  const createCardWithAttachments = async () => {
    if (!user) return;
    setLoading(true)

    const card = await createCard({
      user_id: user.id,
      title,
      description
    })

    console.log("card", card)

    if (card) {
      for (const attachment of selected) {
        await createCardsAttachments(attachment.id, {
          attachment_id: attachment.id,
          card_id: card.id
        })
      }
    }
    setLoading(false)
    router.push("/dashboard")
  }

  return (
    <>
      {
        open &&
        <AttachmentsPickOverlay />
      }
      <Header>
        <HeaderContent>
          <SidebarTrigger />
        </HeaderContent>
        <HeaderContent>
          <Button
            variant="default"
            disabled={disabled}
            onClick={createCardWithAttachments}
          >
            {loading ? <Spinner /> : <PlusIcon />}
            <span>Сохранить</span>
          </Button>
        </HeaderContent>
      </Header>
      <div className="lg:grid flex flex-col lg:grid-cols-2 grid-cols-1 lg:gap-6 gap-0">

        <div className="w-full lg:h-full h-fit">
          <div className="w-full max-w-md mx-auto">
            <Carousel>
              <CarouselContent>
                {
                  selected
                    .map((item) => {
                      const alt = getRefSrc(item.src)
                      const label = item.label || alt || "-"
                      const isVideo = item.mime_type?.startsWith("video/")
                      return (
                        <CarouselItem
                          key={item.id}
                          className="flex items-center justify-center relative"
                        >
                          <Button variant="secondary" size="icon" className="absolute top-3 right-3"><XIcon /></Button>
                          <OptionalVideoProvider isVideo={isVideo} duration={item.duration_ms}>
                            <CollectionCard
                              {...item}
                              label={label}
                              scope="ref"
                              preview={false}
                              className="size-full"
                              style={{
                                aspectRatio: `${item.width}/${item.height}`
                              }}
                            />
                          </OptionalVideoProvider>
                        </CarouselItem>
                      )
                    })
                }
                <CarouselItem>
                  <Button
                    variant="outline"
                    className="lg:h-full h-fit w-full aspect-square rouned-sm flex-col"
                    onClick={() => setOpen(!open)}
                  >
                    <PlusIcon />
                    <span>Добавить вложение</span>
                  </Button>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="lg:-left-12 left-0" />
              <CarouselNext className="lg:-right-12 right-0" />
            </Carousel>

          </div>
        </div>
        <div className="md:p-12 p-6">
          <div className="max-w-md lg:mx-0 mx-auto w-full space-y-3">
            <Input
              placeholder="Название"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Описание"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="flex items-start gap-1">
              {
                selectedTags.map(tag => (
                  <Badge key={tag.id} className="h-6 bg-foreground/50 tabular-nums border-foreground/50 text-background backdrop-blur-3xl">
                    {tag.tag.name}
                  </Badge>
                ))
              }
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
