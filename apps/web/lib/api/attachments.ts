
import type { AttachmentWithTags } from "@/types/attachments";
import { axios } from "../axios";
import { getApiUrl } from "../url";


export async function getAttachments(): Promise<AttachmentWithTags[] | null> {
  try {
    const { data, error } = await axios<AttachmentWithTags[]>({
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

export async function getAttachment(attachmentID: string): Promise<AttachmentWithTags | null> {
  try {
    const { data, error } = await axios<AttachmentWithTags>({
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
