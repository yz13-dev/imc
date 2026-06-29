
import { getApiUrl } from "@/lib/url";
import { getFetchClient } from "../fetch";

const fetch = getFetchClient()

export async function getCollectionCards(collection: string) {
  try {
    const { data, error } = await fetch<any[]>({
      url: getApiUrl("/v1/my/collections/${collection}/cards")
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
