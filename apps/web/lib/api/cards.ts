
import { getApiUrl } from "@/lib/url";
import type { Card, NewCard } from "@/types/cards";
import { getFetchClient } from "../fetch";

const fetch = getFetchClient()

export async function getCards() {
  try {
    const { data, error } = await fetch<Card[]>({
      url: getApiUrl("/v1/my/cards")
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

export async function createCard({ description, title, user_id }: NewCard) {
  try {
    const { data, error } = await fetch<Card>({
      url: getApiUrl("/v1/my/cards"),
      method: "POST",
      body: {
        description, title, user_id
      }
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
