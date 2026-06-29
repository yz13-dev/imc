import type { Tag } from "@/types/attachments";
import { makeFetch } from "../fetch";
import { getApiUrl } from "../url";

export async function getSearchTags(query: string): Promise<Tag[] | null> {
  try {
    const { data, error } = await makeFetch<Tag[]>({
      url: getApiUrl(`/v1/my/tags/search?q=${query}`)
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

export async function createTag(tag: string): Promise<Tag | null> {
  try {
    const { data, error } = await makeFetch<Tag | null>({
      url: getApiUrl(`/v1/my/tags/new`),
      method: "POST",
      body: { name: tag }
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

export async function connectTag(attachmentId: string, tagId: string): Promise<Tag | null> {
  try {
    const { data, error } = await makeFetch<Tag | null>({
      url: getApiUrl(`/v1/my/attachments/${attachmentId}/tags`),
      method: "POST",
      body: { tagId }
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

export async function disconnectTag(attachmentId: string, tagId: string): Promise<Tag | null> {
  try {
    const { data, error } = await makeFetch<Tag | null>({
      url: getApiUrl(`/v1/my/attachments/${attachmentId}/tags`),
      method: "DELETE",
      body: { tagId }
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
