"use server"
import { makeFetch } from "@/lib/fetch/fetch";
import type { User } from "@/types/user";
import { getApiUrl } from "./url";



export async function getMe(): Promise<User | null> {
  try {
    const { data, error } = await makeFetch<{ user: User | null }>({
      method: "GET",
      url: getApiUrl("/auth/me"),
    })
    if (error) throw error;

    const user = data?.user;
    if (!user) return null;

    // @ts-expect-error
    delete user.password;

    return user;
  } catch (error) {
    console.error(error)
    return null;
  }
}
