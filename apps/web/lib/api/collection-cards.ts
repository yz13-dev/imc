
import { axios } from "../axios";
import { getApiUrl } from "../url";


export async function getCollectionCards(collection: string) {
  try {
    const { data, error } = await axios<any[]>({
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
