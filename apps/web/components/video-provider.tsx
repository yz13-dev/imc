
import type { VideoStoreProviderProps } from '@/lib/stores/video-store';
import { VideoStoreProvider } from '@/lib/stores/video-store';

type VideoProviderProps = {
  isVideo?: boolean
} & VideoStoreProviderProps
export function OptionalVideoProvider({ children, isVideo }: VideoProviderProps) {
  if (!isVideo) return children;
  return <VideoStoreProvider>{children}</VideoStoreProvider>
}
