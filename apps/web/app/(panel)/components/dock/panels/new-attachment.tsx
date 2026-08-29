"use client"
import FileUploader from "@/components/file-uploader";
import { inboxAttachment, uploadAttachment } from "@/lib/api/attachments";
import { Button } from "@workspace/ui/components/button";
import { DownloadIcon, FileIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";



type NewAttachmentPanelProps = {
  initialFiles?: File[]
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Б"

  const units = ["Б", "КБ", "МБ", "ГБ"]
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  const formattedValue = value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)

  return `${formattedValue} ${units[unitIndex]}`
}

function FilePreview({ file }: { file: File }) {
  const [src, setSrc] = useState<string>()

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setSrc(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (!src) return <div className="size-12 shrink-0 animate-pulse rounded-md bg-muted" />

  if (file.type.startsWith("video/")) {
    return <video src={src} muted preload="metadata" className="size-12 shrink-0 rounded-md bg-muted object-cover" />
  }

  if (file.type.startsWith("image/")) {
    return <img src={src} alt="" className="size-12 shrink-0 rounded-md bg-muted object-cover" />
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
      <FileIcon className="size-5 text-muted-foreground" />
    </div>
  )
}

export default function NewAttachmentPanel({ initialFiles = [] }: NewAttachmentPanelProps) {

  const [files, setFiles] = useState<File[]>(initialFiles)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const handleDroppedFiles = (event: Event) => {
      const files = (event as CustomEvent<File[]>).detail
      setFiles(prev => [...prev, ...files])
    }

    window.addEventListener("attachment-files-dropped", handleDroppedFiles)
    return () => window.removeEventListener("attachment-files-dropped", handleDroppedFiles)
  }, [])

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(item => item !== file))
  }

  const handleUpload = async (file: File) => {
    try {
      const attachment = await uploadAttachment(file)
      if (attachment) {
        await inboxAttachment(attachment.id)
        removeFile(file)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleBatchUpload = async (files: File[]) => {
    setLoading(true)
    for (const file of files) await handleUpload(file)
    setLoading(false)
  }


  return (
    <div className="dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-xl border p-2 flex flex-col gap-2 w-full max-w-md">
      <FileUploader
        accept="image/*,video/*"
        onFiles={(files) => {
          console.log("files", files)
          setFiles(prev => [...prev, ...files])
        }}
        className="w-full aspect-video rounded-lg border bg-muted flex items-center flex-col gap-4 justify-center"
      >
        <DownloadIcon />
        <span className="max-w-2/3 text-sm text-muted-foreground text-center text-balance">Перенесите файл сюда, или нажмите на область для выбора файла</span>
      </FileUploader>
      {
        files.length > 0 &&
        <ul className="space-y-2 *:px-2">
          {files.map((file, index) => (
            <li key={index}>
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FilePreview file={file} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <Button variant="error" size="icon-sm" onClick={() => removeFile(file)}>
                  <XIcon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      }
      {
        files.length > 0 &&
        <Button size="lg" onClick={() => handleBatchUpload(files)} disabled={loading}>
          {
            loading
              ? <Loader2Icon className="animate-spin" />
              : <UploadIcon />
          }
          <span>Загрузить</span>
        </Button>
      }
    </div>
  )
}
