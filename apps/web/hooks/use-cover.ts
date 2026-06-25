"use client"


const lockScroll = () => {
  document.body.style.overflow = "hidden"
}

const unlockScroll = () => {
  document.body.style.overflow = "auto"
}

export default function useCover() {
  return {
    lock: lockScroll,
    unlock: unlockScroll,
  }
}
