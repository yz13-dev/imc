"use client"
import FileUploader from "@/components/file-uploader";
import { inboxAttachment, uploadAttachment } from "@/lib/api/attachments";
import { Button } from "@workspace/ui/components/button";
import { DownloadIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { useState } from "react";



export default function NewAttachmentPanel() {

  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async (file: Blob, index: number) => {
    try {
      const attachment = await uploadAttachment(file)
      if (attachment) {
        await inboxAttachment(attachment.id)
        removeFile(index)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleBatchUpload = async (files: File[]) => {
    setLoading(true)
    for (const file of files) {
      const index = files.indexOf(file)
      const blob = new Blob([file], { type: file.type })
      await handleUpload(blob, index)
    }
    setLoading(false)
  }


  return (
    <div className="dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-xl border p-2 flex flex-col gap-2">
      <FileUploader
        accept="image/*,video/mp4"
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
              <div className="flex items-center gap-2 justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{file.size}</span>
                </div>
                <Button variant="error" size="icon-sm" onClick={() => removeFile(index)}>
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
