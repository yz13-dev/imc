
import type { AttachmentWithTags } from "@/types/attachments";
import type { InboxItem } from "@/types/inbox";
import { axios } from "../axios";
import { getApiUrl } from "../url";


export async function getInboxAttachments(): Promise<InboxItem[] | null> {
  try {
    const { data, error } = await axios<InboxItem[]>({
      url: getApiUrl("/v1/my/attachments/inbox")
    })

    if (error) {
      throw error;
    }

    // console.log("[INBOX]", data)
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

export async function moveAttachmentToCollection(attachmentID: string, collectionID: string): Promise<any> {
  try {
    const { data, error } = await axios({
      url: getApiUrl(`/v1/my/collections/${collectionID}/attachments?attachmentID=${attachmentID}`),
      method: "POST",
    })

    if (error) {
      throw error;
    }

    return data;

  } catch (error) {
    console.error(error)
    return null;
  }
}

export async function getCollectionAttachments(collectionID: string): Promise<AttachmentWithTags[] | null> {
  try {
    const { data, error } = await axios<AttachmentWithTags[]>({
      url: getApiUrl(`/v1/my/collections/${collectionID}/attachments`),
    })

    if (error) {
      throw error;
    }

    return data;

  } catch (error) {
    console.error(error)
    return null;
  }
}
