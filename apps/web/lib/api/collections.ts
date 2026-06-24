import type { Collection } from "@/types/collections";
import { axios } from "../axios";
import { getApiUrl } from "../url";


export async function getCollections(): Promise<Collection[] | null> {
  try {
    const { data, error } = await axios<Collection[] | null>({
      url: getApiUrl("/v1/my/collections")
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

export async function createCollection({ name, description, user_id }: { name: string, description?: string, user_id: number }) {
  try {
    const { data, error } = await axios<any>({
      method: "POST",
      url: getApiUrl("/v1/my/collections/new"),
      data: { name, description, user_id }
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
    const { data, error } = await axios<Collection | null>({
      method: "DELETE",
      url: getApiUrl(`/v1/my/collections/${collectionID}`)
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
