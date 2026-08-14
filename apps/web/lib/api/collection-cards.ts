
import { getApiProxyUrl } from "@/lib/url";
import type { Card } from "@/types/cards";
import { getFetchClient } from "../fetch";

const fetch = <T,>(...args: Parameters<ReturnType<typeof getFetchClient<T>>>) => getFetchClient<T>()(...args)

export async function getCollectionCards(collection: string) {
  try {
    const { data, error } = await fetch<Card[]>({
      url: getApiProxyUrl(`/v1/my/collections/${collection}/cards`)
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
