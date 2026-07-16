import { environmentManager } from "@tanstack/react-query"
import { makeFetch } from "./fetch"
import { makeClientFetch } from "./fetch-client"


let fetchClient: typeof makeClientFetch | undefined = undefined

export function getFetchClient() {
  if (environmentManager.isServer()) {
    return makeFetch
  } else {
    // Browser: reuse the same client fetch reference so we don't re-make a
    // new one if React suspends during the initial render.
    if (!fetchClient) fetchClient = makeClientFetch
    return fetchClient
  }
}
