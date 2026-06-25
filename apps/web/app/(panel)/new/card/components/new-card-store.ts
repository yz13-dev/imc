import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { create } from "zustand"




type State = {
  openPicker: boolean
  attachments: AttachmentWithMaybeTagsAndSource[]
}
type Actions = {
  setOpenPicker: (open: boolean) => void
  setAttachments: (attachments: AttachmentWithMaybeTagsAndSource[]) => void
}

export const useNewCardStore = create<State & Actions>((set) => ({
  openPicker: false,
  attachments: [],
  setOpenPicker: (open) => set({ openPicker: open }),
  setAttachments: (attachments) => set({ attachments }),
}))
