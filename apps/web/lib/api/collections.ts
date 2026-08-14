import { getApiProxyUrl } from "@/lib/url";
import type { Collection } from "@/types/collections";
import { getFetchClient } from "../fetch";

const fetch = <T,>(...args: Parameters<ReturnType<typeof getFetchClient<T>>>) => getFetchClient<T>()(...args)

export async function getCollections(): Promise<Collection[] | null> {
  try {
    const { data, error } = await fetch<Collection[] | null>({
      url: getApiProxyUrl("/v1/my/collections")
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

export async function createCollection({ name, description, user_id }: { name: string, description?: string, user_id: string }) {
  try {
    const { data, error } = await fetch<Collection>({
      method: "POST",
      url: getApiProxyUrl("/v1/my/collections/new"),
      body: { name, description, user_id }
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

export async function deleteCollection(collectionID: string) {
  try {
    const { data, error } = await fetch<Collection | null>({
      method: "DELETE",
      url: getApiProxyUrl(`/v1/my/collections/${collectionID}`)
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
