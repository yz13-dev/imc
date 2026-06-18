
import type { Attachment } from "@/types/attachments";
import { axios } from "../axios";
import { getApiUrl } from "../url";


export async function getAttachments(): Promise<Attachment[] | null> {
  try {
    const { data, error } = await axios<any[]>({
      url: getApiUrl("/v1/my/attachments")
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

export async function getAttachment(attachmentID: string): Promise<Attachment | null> {
  try {
    const { data, error } = await axios<Attachment>({
      url: getApiUrl(`/v1/my/attachments/${attachmentID}`)
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
