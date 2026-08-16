import {
  dehydrate,
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

// lib/api/*.ts functions swallow request failures and resolve to `null`
// instead of throwing, so a failed prefetch still leaves the query in a
// "success" state -- just with null data. Dehydrating that as-is would ship
// a fake-fresh empty result to the client, and with staleTime set above,
// useSuspenseQuery would treat it as up to date and never actually
// re-fetch, silently hiding the failure.
//
// The fix isn't to drop these queries from the dehydrated state, though --
// useSuspenseQuery only invokes queryFn synchronously during render
// (Suspense's fetchOptimistic path) when there's no cached data at all. On
// the SSR pass that renders these client components server-side, queryFn
// still resolves to the "use server" fetcher (lib/fetch/fetch.ts), and
// Next.js forbids calling that mid-render ("Server Functions cannot be
// called during initial render") -- so omitting the data here previously
// turned a silently-empty grid into a hard crash instead.
//
// Keep the data, but stamp it as already-expired (dataUpdatedAt: 0) so
// useSuspenseQuery still finds cached data during the SSR render (no
// fetchOptimistic, no crash), while React Query's normal refetch-on-mount
// behavior -- which runs in an effect *after* mount, safely client-side --
// kicks off a real refetch instead of trusting the masked failure for the
// next staleTime window.
export function dehydrateState(queryClient: QueryClient) {
  for (const query of queryClient.getQueryCache().getAll()) {
    if (query.state.data === null) {
      queryClient.setQueryData(query.queryKey, null, { updatedAt: 0 })
    }
  }
  return dehydrate(queryClient)
}
