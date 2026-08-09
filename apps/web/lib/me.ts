"use server"
import { makeFetch } from "@/lib/fetch/fetch";
import type { User } from "@/types/user";
import { getAuthUrl } from "./url";



export async function getMe(): Promise<User | null> {
  try {
    const { data, error } = await makeFetch<{ user: User | null }>({
      method: "GET",
      url: getAuthUrl("/api/auth/get-session"),
    })
    if (error) throw error;

    const user = data?.user;
    if (!user) return null;

    return user;
  } catch (error) {
    console.error(error)
    return null;
  }
}

export async function signOut() {
  try {
    await makeFetch({
      method: "POST",
      url: getAuthUrl("/api/auth/sign-out"),
    })
  } catch (error) {
    console.error(error)
  }
}
