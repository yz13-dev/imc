"use server"

import { axios } from "./axios";



export async function getMe() {
  try {
    const { data, error } = await axios({
      method: "GET",
      url: "/auth/me",
    })
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error)
    return null;
  }
}
