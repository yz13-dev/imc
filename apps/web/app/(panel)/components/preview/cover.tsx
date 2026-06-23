"use client"
import { motion } from "motion/react"
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
  const [id, setId] = useQueryState(coverKey)
  useEffect(() => {
    if (!id) {
      unlockScroll()
      return
    }
    lockScroll()
    return () => unlockScroll()
  }, [id])
  if (!id) return null
  return (
    <motion.div
      className="fixed inset-0 w-full h-svh z-50 py-6 backdrop-blur-sm flex items-end justify-center bg-black/10"
      onClick={e => {
        e.stopPropagation()
        setId(null)
      }}
    >
      {children}
    </motion.div>
  )
}
