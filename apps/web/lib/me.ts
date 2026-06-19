"use server"
import type { User } from "@/types/user";
import { axios } from "./axios";
import { getApiUrl } from "./url";



export async function getMe(): Promise<User | null> {
  try {
    const { data, error } = await axios<{ user: User | null }>({
      method: "GET",
      url: getApiUrl("/auth/me"),
    })
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error(error)
    return null;
  }
}
