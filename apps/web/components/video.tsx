
"use client"

import useInterval from "@/hooks/use-interval"
import { useVideoStore } from "@/lib/stores/video-store"
import { cn } from "@workspace/ui/lib/utils"
import { useEffect, useRef } from "react"

type VideoProps = {

} & React.ComponentPropsWithoutRef<"video">
export default function Video({ className = "", ...props }: VideoProps) {

  const ref = useRef<HTMLVideoElement>(null)
  const setPlaying = useVideoStore(state => state.setPlaying)
  const setPosition = useVideoStore(state => state.setPosition)

  const onPlay = () => setPlaying(true)
  const onPause = () => setPlaying(false)



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
