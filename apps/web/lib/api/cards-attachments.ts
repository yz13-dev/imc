import { getApiUrl } from "@/lib/url";
import type { CardsAttachment, NewCardsAttachment } from "@/types/cards-attachments";
import { getFetchClient } from "../fetch";

const fetch = getFetchClient()

export async function createCardsAttachments(attachmentId: string, body: NewCardsAttachment) {
  try {
    const { data, error } = await fetch<CardsAttachment>({
      url: getApiUrl(`/v1/my/attachments/${attachmentId}/cards`),
      method: "POST",
      body
    })

    if (error) {
      throw error;
    }

    return data;

  } catch (error) {
    console.error(error)
    return null
  }
}
