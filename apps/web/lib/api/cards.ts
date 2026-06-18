
import { axios } from "../axios";
import { getApiUrl } from "../url";


export async function getCards() {
  try {
    const { data, error } = await axios<any[]>({
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
