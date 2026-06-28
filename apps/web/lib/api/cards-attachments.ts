import type { CardsAttachment, NewCardsAttachment } from "@/types/cards-attachments";
import { axios } from "../axios";
import { getApiUrl } from "../url";


export async function createCardsAttachments(attachmentId: string, body: NewCardsAttachment) {
  try {
    const { data, error } = await axios<CardsAttachment>({
      url: getApiUrl(`/v1/my/attachments/${attachmentId}/cards`),
      method: "POST",
      data: body
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
