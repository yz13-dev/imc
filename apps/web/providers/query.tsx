"use client"
import { getQueryClient } from '@/lib/query-client'
import {
  QueryClientProvider
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const SHOW_QUERY_DEVTOOL = process.env.SHOW_QUERY_DEVTOOL === 'true'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider
      client={queryClient}
    >
      {children}
      {
        SHOW_QUERY_DEVTOOL &&
        <ReactQueryDevtools initialIsOpen={false} />
      }
    </QueryClientProvider>
  )
}
