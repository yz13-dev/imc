
import { axios } from "../axios";


export async function getCards() {
  try {
    const { data, error } = await axios<any[]>({
      baseURL: "http://localhost:8080",
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
