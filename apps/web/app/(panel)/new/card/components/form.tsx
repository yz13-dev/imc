"use client"
import CollectionCard from "@/app/(panel)/[user]/[collection]/components/collection-card"
import Header, { HeaderContent } from "@/app/(panel)/components/header"
import SidebarTrigger from "@/app/(panel)/components/header/sidebar-trigger"
import { OptionalVideoProvider } from "@/components/video-provider"
import { getRefSrc } from "@/lib/ref-src"
import { Button } from "@workspace/ui/components/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@workspace/ui/components/carousel"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { PlusIcon, XIcon } from "lucide-react"
import AttachmentsPickOverlay from "./attachments-pick-overlay"
import { useNewCardStore } from "./new-card-store"

export default function Form() {

  const open = useNewCardStore((state) => state.openPicker)
  const setOpen = useNewCardStore((state) => state.setOpenPicker)

  const selected = useNewCardStore(state => state.attachments)

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
          <Button variant="default"><PlusIcon /><span>Сохранить</span></Button>
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
            <Input placeholder="Название" />
            <Textarea placeholder="Описание" />
          </div>
        </div>
      </div>

    </>
  )
}
