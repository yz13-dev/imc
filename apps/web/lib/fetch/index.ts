import { makeFetch } from "./fetch"
import { makeClientFetch } from "./fetch-client"

// Resolves the environment on every call (not once at module load) --
// callers used to cache `getFetchClient()`'s return value in a module-level
// const, which could pin a file to the server-only "use server" fetcher
// (makeFetch) forever, even when later invoked from the browser. That
// surfaced as "Server Functions cannot be called during initial render"
// once TanStack Query's experimental_prefetchInRender started invoking
// queryFns during the client's first render.
export function getFetchClient<T>(): typeof makeFetch<T> {
  return (typeof window === "undefined" ? makeFetch : makeClientFetch) as typeof makeFetch<T>
}
