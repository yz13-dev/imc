import type { Tag } from "@/types/attachments";
import { axios } from "../axios";
import { getApiUrl } from "../url";

export async function getSearchTags(query: string): Promise<Tag[] | null> {
  try {
    const { data, error } = await axios<Tag[]>({
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
    const { data, error } = await axios<Tag | null>({
      url: getApiUrl(`/v1/my/tags/new`),
      method: "POST",
      data: { name: tag }
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
    const { data, error } = await axios<Tag | null>({
      url: getApiUrl(`/v1/my/attachments/${attachmentId}/tags`),
      method: "POST",
      data: { tagId }
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
    const { data, error } = await axios<Tag | null>({
      url: getApiUrl(`/v1/my/attachments/${attachmentId}/tags`),
      method: "DELETE",
      data: { tagId }
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
