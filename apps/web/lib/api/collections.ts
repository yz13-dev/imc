import { axios } from "../axios";
import { API_URL } from "./const";


export async function getCollections() {
  try {
    const { data, error } = await axios<any[]>({
      baseURL: API_URL,
      url: "/v1/my/collections"
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
