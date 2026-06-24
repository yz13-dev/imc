
import type { AttachmentWithMaybeTagsAndSource, AttachmentWithTags } from "@/types/attachments";
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

type ListQuery = {
  offset?: number;
  limit?: number;
}
export async function getAllAttachments(query?: ListQuery): Promise<AttachmentWithTags[] | null> {
  try {
    const url = new URL("/v1/my/attachments", getApiUrl())
    if (query) {
      if (query.offset !== undefined) url.searchParams.set("offset", query.offset.toString())
      if (query.limit !== undefined) url.searchParams.set("limit", query.limit.toString())
    }
    const { data, error } = await axios<AttachmentWithTags[]>({
      url: url.toString(),
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

export async function permanentlyDeleteAttachment(attachmentID: string): Promise<{ id: string } | null> {
  try {
    const { data, error } = await axios<{ id: string } | null>({
      url: getApiUrl(`/v1/my/attachments/${attachmentID}`),
      method: "DELETE",
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

export async function moveToTrashAttachment(attachmentID: string): Promise<{ id: string } | null> {
  try {
    const { data, error } = await axios<{ id: string } | null>({
      url: getApiUrl(`/v1/my/attachments/${attachmentID}/trash`),
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

export async function getTrashAttachments(): Promise<AttachmentWithMaybeTagsAndSource[] | null> {
  try {
    const { data, error } = await axios<AttachmentWithMaybeTagsAndSource[]>({
      url: getApiUrl("/v1/my/attachments/trash")
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
