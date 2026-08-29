
import { getFetchClient } from "@/lib/fetch";
import { getApiProxyUrl } from "@/lib/url";
import type { Attachment, AttachmentWithMaybeTagsAndSource, AttachmentWithTags, UpdateAttachment } from "@/types/attachments";
import type { InboxItem } from "@/types/inbox";

const fetch = <T,>(...args: Parameters<ReturnType<typeof getFetchClient<T>>>) => getFetchClient<T>()(...args)

export async function updateAttachment(attachmentID: string, body: UpdateAttachment): Promise<AttachmentWithMaybeTagsAndSource | null> {
  try {
    const { data, error } = await fetch<AttachmentWithMaybeTagsAndSource | null>({
      url: getApiProxyUrl(`/v1/my/attachments/${attachmentID}`),
      method: "PATCH",
      body: body
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

export async function publishAttachment(attachmentID: string) {
  return updateAttachment(attachmentID, { public: true })
}

type ListQuery = {
  cursor?: string | null;
  limit?: number;
  tags?: string[];
}

export type Page<T> = {
  items: T[];
  next_cursor: string;
}

function applyListQuery(url: URL, query?: ListQuery) {
  if (!query) return
  if (query.cursor) url.searchParams.set("cursor", query.cursor)
  if (query.limit !== undefined) url.searchParams.set("limit", query.limit.toString())
  if (query.tags?.length) url.searchParams.set("tags", query.tags.join(","))
}

export async function getInboxAttachments(query?: ListQuery): Promise<Page<InboxItem> | null> {
  try {
    const url = new URL(getApiProxyUrl("/v1/my/attachments/inbox"))
    applyListQuery(url, query)

    const { data, error } = await fetch<Page<InboxItem>>({
      url: url.toString()
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
    const { data, error } = await fetch<AttachmentWithTags>({
      url: getApiProxyUrl(`/v1/my/attachments/${attachmentID}`)
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

export async function getPublicAttachment(attachmentID: string): Promise<AttachmentWithTags | null> {
  try {
    const { data, error } = await fetch<AttachmentWithTags>({
      url: getApiProxyUrl(`/v1/attachments/${attachmentID}`)
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function moveAttachmentToCollection(attachmentID: string, collectionID: string): Promise<unknown> {
  try {
    const { data, error } = await fetch<unknown>({
      url: getApiProxyUrl(`/v1/my/collections/${collectionID}/attachments?attachmentID=${attachmentID}`),
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

export async function removeAttachmentFromCollection(attachmentID: string, collectionID: string): Promise<unknown> {
  try {
    const { data, error } = await fetch<unknown>({
      url: getApiProxyUrl(`/v1/my/collections/${collectionID}/attachments?attachmentID=${attachmentID}`),
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

export async function getCollectionAttachments(collectionID: string, query?: ListQuery): Promise<Page<AttachmentWithTags> | null> {
  try {
    const url = new URL(getApiProxyUrl(`/v1/my/collections/${collectionID}/attachments`))
    applyListQuery(url, query)

    const { data, error } = await fetch<Page<AttachmentWithTags>>({
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

export async function getPublicCollectionAttachments(collectionID: string, query?: ListQuery): Promise<Page<AttachmentWithTags> | null> {
  try {
    const url = new URL(getApiProxyUrl(`/v1/collections/${collectionID}/attachments`))
    applyListQuery(url, query)
    const { data, error } = await fetch<Page<AttachmentWithTags>>({
      url: url.toString(),
    })
    // console.log(getApiProxyUrl(`/v1/collections/${collectionID}/attachments`))

    if (error) {
      throw error;
    }

    return data;

  } catch (error) {
    console.error(error)
    return null;
  }
}

export async function getAllAttachments(query?: ListQuery): Promise<Page<AttachmentWithTags> | null> {
  try {
    const url = new URL(getApiProxyUrl("/v1/my/attachments"))
    applyListQuery(url, query)
    const { data, error } = await fetch<Page<AttachmentWithTags>>({
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
    const { data, error } = await fetch<{ id: string } | null>({
      url: getApiProxyUrl(`/v1/my/attachments/${attachmentID}`),
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
    const { data, error } = await fetch<{ id: string } | null>({
      url: getApiProxyUrl(`/v1/my/attachments/${attachmentID}/trash`),
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

export async function restoreAttachment(attachmentID: string): Promise<{ id: string } | null> {
  try {
    const { data, error } = await fetch<{ id: string } | null>({
      url: getApiProxyUrl(`/v1/my/attachments/${attachmentID}/untrash`),
      method: "POST",
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getTrashAttachments(query?: ListQuery): Promise<Page<AttachmentWithMaybeTagsAndSource> | null> {
  try {
    const url = new URL(getApiProxyUrl("/v1/my/attachments/trash"))
    applyListQuery(url, query)
    const { data, error } = await fetch<Page<AttachmentWithMaybeTagsAndSource>>({
      url: url.toString()
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

export async function uploadAttachment(file: Blob): Promise<Attachment | null> {
  try {
    const formData = new FormData()

    formData.append("file", file)

    const { data, error } = await fetch<Attachment | null>({
      url: getApiProxyUrl("/v1/my/attachments/new"),
      method: "POST",
      body: formData,
    });

    if (error) {
      throw error;
    }

    return data;

  } catch (error) {
    console.error(error)
    return null
  }
}

export async function inboxAttachment(id: string) {
  try {
    const { status } = await fetch<null>({
      url: getApiProxyUrl(`/v1/my/attachments/inbox?attachmentID=${id}`),
      method: "POST",
    });
    return { status };
  } catch (error) {
    console.error(error)
    return null
  }
}
