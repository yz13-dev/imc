
import type { VideoStoreProviderProps } from '@/lib/stores/video-store';
import { VideoStoreProvider } from '@/lib/stores/video-store';

type VideoProviderProps = {
  isVideo?: boolean
} & VideoStoreProviderProps
export function OptionalVideoProvider({ children, isVideo }: VideoProviderProps) {
  return <VideoStoreProvider>{children}</VideoStoreProvider>
}
