"use client"

import { useDockPanel } from "./panel-context"
import NewAttachmentPanel from "./panels/new-attachment"
import { useEffect, useState } from "react"

function isSupportedFile(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/")
}

export default function GlobalDropZone() {
  const { open, panel } = useDockPanel()
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const hasFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.items ?? []).some(item => item.kind === "file") ||
      event.dataTransfer?.types.includes("Files") === true

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
      if (hasFiles(event)) setIsDragging(true)
    }

    const handleDragEnter = (event: DragEvent) => {
      if (hasFiles(event)) setIsDragging(true)
    }

    const handleDrop = (event: DragEvent) => {
      const isInsideFileUploader = event.composedPath().some(
        target => target instanceof Element && target.hasAttribute("data-file-uploader")
      )
      if (isInsideFileUploader) {
        setIsDragging(false)
        return
      }

      event.preventDefault()
      setIsDragging(false)

      const files = Array.from(event.dataTransfer?.files ?? []).filter(isSupportedFile)
      if (files.length > 0) {
        if (panel?.id === "new-attachment") {
          window.dispatchEvent(new CustomEvent<File[]>("attachment-files-dropped", { detail: files }))
        } else {
          open("new-attachment", <NewAttachmentPanel initialFiles={files} />)
        }
      }
    }

    const handleDragLeave = (event: DragEvent) => {
      // The window receives dragleave while the cursor moves between elements.
      // Reset only when the cursor actually leaves the viewport.
      if (
        event.clientX <= 0 ||
        event.clientY <= 0 ||
        event.clientX >= window.innerWidth ||
        event.clientY >= window.innerHeight
      ) {
        setIsDragging(false)
      }
    }

    const handleDragEnd = () => setIsDragging(false)
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDragging(false)
    }

    document.addEventListener("dragenter", handleDragEnter, true)
    document.addEventListener("dragover", handleDragOver, true)
    document.addEventListener("drop", handleDrop, true)
    document.addEventListener("dragleave", handleDragLeave, true)
    document.addEventListener("dragend", handleDragEnd, true)
    window.addEventListener("blur", handleDragEnd)
    window.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("dragenter", handleDragEnter, true)
      document.removeEventListener("dragover", handleDragOver, true)
      document.removeEventListener("drop", handleDrop, true)
      document.removeEventListener("dragleave", handleDragLeave, true)
      document.removeEventListener("dragend", handleDragEnd, true)
      window.removeEventListener("blur", handleDragEnd)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [open, panel])

  if (!isDragging) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-6 backdrop-blur-sm">
      <div className="rounded-xl border-2 border-dashed border-primary bg-background/90 px-8 py-6 text-center shadow-lg">
        <p className="font-medium">Отпустите файлы, чтобы добавить вложения</p>
        <p className="mt-1 text-sm text-muted-foreground">Изображения, GIF и видео</p>
      </div>
    </div>
  )
}
