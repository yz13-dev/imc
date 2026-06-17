
import { axios } from "../axios";
import { API_URL } from "./const";


export async function getCards() {
  try {
    const { data, error } = await axios<any[]>({
      baseURL: API_URL,
      url: `/v1/my/cards`
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
