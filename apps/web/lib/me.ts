"use server"

import { axios } from "./axios";
import { getApiUrl } from "./url";



export async function getMe() {
  try {
    const { data, error } = await axios({
      method: "GET",
      url: getApiUrl("/auth/me"),
    })
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error)
    return null;
  }
}
