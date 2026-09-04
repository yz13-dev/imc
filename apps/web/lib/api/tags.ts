import { getApiProxyUrl } from "@/lib/url";
import type { Tag, TagWithCount } from "@/types/attachments";
import { getFetchClient } from "../fetch";

const fetch = <T,>(...args: Parameters<ReturnType<typeof getFetchClient<T>>>) => getFetchClient<T>()(...args)

export async function getTagsWithCounts(collectionID?: string): Promise<TagWithCount[] | null> {
  try {
    const url = new URL(getApiProxyUrl("/v1/my/tags"))
    if (collectionID) url.searchParams.set("collectionID", collectionID)

    const { data, error } = await fetch<TagWithCount[]>({
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

export async function getPublicCollectionTags(collectionID: string): Promise<Pick<TagWithCount, "id" | "name" | "count">[] | null> {
  try {
    const { data, error } = await fetch<Pick<TagWithCount, "id" | "name" | "count">[]>({
      url: getApiProxyUrl(`/v1/collections/${collectionID}/tags`)
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getSearchTags(query: string): Promise<Tag[] | null> {
  try {
    const { data, error } = await fetch<Tag[]>({
      url: getApiProxyUrl(`/v1/my/tags/search?q=${query}`)
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
    const { data, error } = await fetch<Tag | null>({
      url: getApiProxyUrl(`/v1/my/tags/new`),
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
    const { data, error } = await fetch<Tag | null>({
      url: getApiProxyUrl(`/v1/my/attachments/${attachmentId}/tags`),
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
    const { data, error } = await fetch<Tag | null>({
      url: getApiProxyUrl(`/v1/my/attachments/${attachmentId}/tags`),
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
