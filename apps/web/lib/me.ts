"use server"

import { API_URL } from "./api/const";
import { axios } from "./axios";



export async function getMe() {
  try {
    const { data, error } = await axios({
      method: "GET",
      baseURL: API_URL,
      url: "/auth/me",
    })
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error)
    return null;
  }
}
