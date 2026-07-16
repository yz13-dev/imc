
import { getApiUrl } from "@/lib/url";
import type { Card } from "@/types/cards";
import { getFetchClient } from "../fetch";

const fetch = getFetchClient()

export async function getCollectionCards(collection: string) {
  try {
    const { data, error } = await fetch<Card[]>({
      url: getApiUrl(`/v1/my/collections/${collection}/cards`)
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
