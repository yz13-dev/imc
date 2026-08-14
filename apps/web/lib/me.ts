"use server"
import { getMe as getSdkUser } from "@/lib/auth";
import type { User } from "@/types/user";
import { makeFetch } from "@/lib/fetch/fetch";
import { getSiteUrl } from "./url";

export async function getMe(): Promise<User | null> {
  try {
    const user = await getSdkUser();
    if (!user) return null;
    return user as unknown as User;
  } catch (error) {
    console.error(error)
    return null;
  }
}

export async function signOut() {
  try {
    // Hits our own /auth/signout route (auth.handlers.signOut), which
    // clears the local yz13_session cookie and best-effort revokes the
    // token on the central auth service -- not central auth directly.
    await makeFetch({
      method: "POST",
      url: getSiteUrl("/auth/signout"),
    })
  } catch (error) {
    console.error(error)
  }
}
