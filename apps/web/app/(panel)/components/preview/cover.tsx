"use client"

import { AnimatePresence } from "motion/react"
import { useQueryState } from "nuqs"
import { useEffect } from "react"


type CoverProps = {
  children?: React.ReactNode
  coverKey?: string
}


const lockScroll = () => {
  document.body.style.overflow = "hidden"
}

const unlockScroll = () => {
  document.body.style.overflow = "auto"
}

export default function Cover({ children, coverKey = "id" }: CoverProps) {
  const [id, setId] = useQueryState(coverKey, { shallow: false })
  useEffect(() => {
    lockScroll()
    return () => unlockScroll()
  }, [])
  return (
    <div
      className="absolute inset-0 w-full h-svh z-50 py-6 backdrop-blur-sm flex items-end justify-center bg-black/10"
      onClick={e => {
        e.stopPropagation()
        setId(null)
      }}
    >
      <AnimatePresence mode="popLayout">
        {id && children}
      </AnimatePresence>
    </div>
  )
}
