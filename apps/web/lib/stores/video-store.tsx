"use client"
import { createContext, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'

interface VideoStoreProps {
}

interface VideoStoreState extends VideoStoreProps {
}

type VideoStoreStore = ReturnType<typeof createVideoStoreStore>

const createVideoStoreStore = (initProps?: Partial<VideoStoreProps>) => {
  const DEFAULT_PROPS: VideoStoreProps = {
  }
  return createStore<VideoStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
  }))
}

export const VideoStoreContext = createContext<VideoStoreStore | null>(null)

export type VideoStoreProviderProps = React.PropsWithChildren<Partial<VideoStoreProps>>

export function VideoStoreProvider({ children, ...props }: VideoStoreProviderProps) {
  const [store] = useState(() => createVideoStoreStore(props))

  return <VideoStoreContext.Provider value={store}>{children}</VideoStoreContext.Provider>
}

export function useVideoStore<T>(selector: (state: VideoStoreState) => T): T {
  const store = useContext(VideoStoreContext)
  if (!store) throw new Error('Missing VideoStoreContext.Provider in the tree')
  return useStore(store, selector)
}
