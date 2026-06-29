"use client"

import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BackButton() {

  const canMoveBack = history.length > 0
  const router = useRouter()

  if (!canMoveBack) return;
  return (
    <Button variant="outline" onClick={() => router.back()}>
      <ArrowLeftIcon /><span>Назад</span>
    </Button>
  )
}
