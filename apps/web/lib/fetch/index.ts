import { environmentManager } from "@tanstack/react-query"
import { makeFetch } from "./fetch"
import { makeClientFetch } from "./fetch-client"


let fetchClient: typeof makeFetch | undefined = undefined

export function getFetchClient() {
  console.log("[ENV]", environmentManager.isServer() ? "SERVER" : "CLIENT")
  if (environmentManager.isServer()) {
    // Server: always make a new query client
    return makeFetch
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!fetchClient) fetchClient = makeClientFetch
    return makeClientFetch
  }
}
