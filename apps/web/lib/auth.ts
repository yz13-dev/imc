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
  // The SDK defaults to preview.auth.yz13.dev in dev (NODE_ENV based), but
  // IMC's oauth_client is currently only registered in prod auth -- pinned
  // explicitly so local dev matches what's actually registered. Revisit if
  // a staging client gets registered too.
  issuer: "https://auth.yz13.dev",
  clientId: process.env.YZ13_AUTH_CLIENT_ID!,
  clientSecret: process.env.YZ13_AUTH_CLIENT_SECRET,
  redirectUri: getSiteUrl("/auth/callback"),
  cookieName: AUTH_SESSION_COOKIE,
})

export const getMe = () => auth.getUser()
