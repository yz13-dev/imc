import { createNextAuth } from "@yz13/auth-sdk/nextjs";
import { getSiteUrl } from "./url";

export const AUTH_SESSION_COOKIE = "yz13_session";

export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: string
  updatedAt: string
  role?: string
  banned?: boolean
  banReason?: string | null
  banExpires?: string | null
  username?: string
  displayUsername?: string
}

export const auth = createNextAuth({
  // No explicit issuer: the SDK defaults to preview.auth.yz13.dev in dev
  // (NODE_ENV based) and auth.yz13.dev in prod. Requires IMC's oauth_client
  // to be registered on both -- currently only registered on prod.
  clientId: process.env.YZ13_AUTH_CLIENT_ID!,
  clientSecret: process.env.YZ13_AUTH_CLIENT_SECRET,
  redirectUri: getSiteUrl("/auth/callback"),
  cookieName: AUTH_SESSION_COOKIE,
})

export const getMe = () => auth.getUser()
