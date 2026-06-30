"use client"
import { useInterval } from "@workspace/ui/hooks/use-interval"
import { cn } from "@workspace/ui/lib/utils"
import { useInView } from 'motion/react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
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

type VideoStore = ReturnType<typeof createVideoStoreStore>

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

const VideoStoreContext = createContext<VideoStore | null>(null)

type VideoProviderProps = React.PropsWithChildren<Partial<VideoStoreProps>>

function VideoProvider({ children, ...props }: VideoProviderProps) {
  const [store] = useState(() => createVideoStoreStore(props))

  return <VideoStoreContext.Provider value={store}>{children}</VideoStoreContext.Provider>
}

function useVideoStore<T>(selector: (state: VideoStoreState) => T): T {
  const store = useContext(VideoStoreContext)
  if (!store) throw new Error('Missing VideoStoreContext.Provider in the tree')
  return useStore(store, selector)
}

type VideoProps = {} & React.ComponentPropsWithoutRef<"video">

function Video({ className = "", ...props }: VideoProps) {

  const ref = useRef<HTMLVideoElement>(null)
  // const playing = useVideoStore(state => state.playing)
  const setPlaying = useVideoStore(state => state.setPlaying)
  const setPosition = useVideoStore(state => state.setPosition)

  const onPlay = () => setPlaying(true)
  const onPause = () => setPlaying(false)

  const inView = useInView(ref)

  useEffect(() => {
    const video = ref.current;
    if (video) {
      if (!inView) video.pause()
      else video.play()
    }

  }, [inView])
  useInterval(() => {
    const video = ref.current;
    if (video) {
      const currentTime = video.currentTime
      setPosition(currentTime)
    }
  }, 1000)
  useEffect(() => {
    const video = ref.current;
    if (video) {
      video.addEventListener("play", onPlay)
      video.addEventListener("pause", onPause)
      return () => {
        video.removeEventListener("play", onPlay)
        video.removeEventListener("pause", onPause)
      }
    }
  })
  return <video ref={ref} className={cn("", className)} {...props} />
}

export { Video, VideoProvider }
export type { VideoProps, VideoProviderProps }

