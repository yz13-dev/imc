"use client"
import { createContext, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'

interface VideoStoreProps {
  playing: boolean
  duration: number
  position: number
}

interface VideoStoreState extends VideoStoreProps {
  setPlaying: (playing: boolean) => void
  setPosition: (position: number) => void
}

type VideoStoreStore = ReturnType<typeof createVideoStoreStore>

const createVideoStoreStore = (initProps?: Partial<VideoStoreProps>) => {
  const DEFAULT_PROPS: VideoStoreProps = {
    playing: false,
    duration: 0,
    position: 0,
  }
  return createStore<VideoStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setPlaying: (playing: boolean) => set({ playing }),
    setPosition: (position: number) => set({ position }),
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
