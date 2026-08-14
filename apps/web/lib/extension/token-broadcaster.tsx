"use client"
import { useEffect } from "react"

type TokenBroadcasterProps = {
  token?: string | null
}

// The IMC browser extension's content script listens for a token via
// postMessage on this origin (and a few trusted others -- see
// apps/extension/src/entrypoints/content.ts's ALLOWED_ORIGINS).
//
// auth.yz13.dev also broadcasts this way, but only helps on a user's very
// first authorization: once an oauthConsent row exists, /oauth2/authorize
// redirects straight to this app's own /auth/callback in one server-side
// hop, without ever rendering a page on auth's origin for client JS to run
// on. This app's own pages always render regardless, so broadcasting the
// session cookie's token here (which is the same OAuth access token
// apps/api already verifies for the web app itself) covers every login,
// first-time or returning.
export default function TokenBroadcaster({ token }: TokenBroadcasterProps) {
  useEffect(() => {
    if (!token) return
    window.postMessage({ type: "IMC_AUTH_TOKEN", token }, window.location.origin)
  }, [token])

  return null
}
