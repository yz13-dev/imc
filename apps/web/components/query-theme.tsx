"use client"

import { useTheme } from "next-themes"
import { useQueryState } from "nuqs"
import { useEffect } from "react"


export default function QueryTheme() {

  const { setTheme } = useTheme()
  const [queryTheme] = useQueryState("theme")

  useEffect(() => {
    if (queryTheme) {
      if (queryTheme === "light") setTheme("light")
      if (queryTheme === "dark") setTheme("dark")
      if (queryTheme === "system") setTheme("system")
    }
  }, [queryTheme])
  return null
}
