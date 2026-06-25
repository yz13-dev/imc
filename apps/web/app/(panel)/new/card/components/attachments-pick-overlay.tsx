"use client"
import CardGrid from "@/app/(panel)/components/card-grid";
import Overlay from "@/components/overlay";
import { useGlobalStore } from "@/lib/stores/global-store";
import { useNewCardStore } from "./new-card-store";

export default function AttachmentsPickOverlay() {

  const all = useGlobalStore(state => state.all)

  const selected = useNewCardStore(state => state.attachments)
  const setSelected = useNewCardStore(state => state.setAttachments)

  // const openPicker = useNewCardStore(state => state.openPicker)
  const setOpenPicker = useNewCardStore(state => state.setOpenPicker)

  const withoutSelected = all.filter(a => !selected.some(s => s.id === a.id))

  return (
    <Overlay
      className="items-start justify-center"
      onClick={() => {
        setOpenPicker(false)
      }}
    >
      <div
        className="w-full max-w-2xl h-full overflow-y-auto"
        onClickCapture={e => {
          const target = e.target as HTMLElement
          console.log("click", e)
          console.log("target", target)
          const id = target.getAttribute("data-id")
          console.log("id", id)

          if (id) {
            const attachment = all.find(a => a.id === id)
            console.log("attachment", attachment)
            if (attachment) {
              setSelected([...selected, attachment])
              setOpenPicker(false)
            }
          }

        }}
      >
        <CardGrid attachments={withoutSelected} withPreview={false} card={{ noLink: true }} />
      </div>
    </Overlay>
  );
}
