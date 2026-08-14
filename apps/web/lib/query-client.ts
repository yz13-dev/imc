import {
  environmentManager,
  QueryClient
} from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // experimental_prefetchInRender lets queryFn run synchronously
        // during render (incl. the client's initial render) -- but queryFn
        // here can resolve to a "use server" fetcher (lib/fetch/fetch.ts),
        // and Next.js forbids invoking Server Actions during that render
        // pass ("Server Functions cannot be called during initial render").
        // Left off until queryFn is guaranteed to never reach a Server
        // Action; queries just fetch in an effect after mount instead.
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 2 * 60 * 1000,
        refetchInterval: 2 * 60 * 1000
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (environmentManager.isServer()) {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
