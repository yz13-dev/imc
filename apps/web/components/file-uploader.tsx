"use client";
import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";
import React from "react";


type FileUploaderProps = ComponentProps<"div"> & {
  accept?: string;
  onFiles: (file: File[]) => void;
}

export default function FileUploader({ onFiles, className = "", accept, children, onClick, ...props }: FileUploaderProps) {
  const ref = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Required to allow dropping
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Extract file from the drop event
    const file = e.dataTransfer.files;
    if (file) {
      onFiles(Array.from(file));
    }
  };

  return (
    <div
      data-file-uploader
      onClick={e => {
        e.stopPropagation()
        ref.current?.click()
        onClick?.(e)
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn("relative", className)}
      {...props}
    >
      {children}
      <input
        ref={ref}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          onFiles(Array.from(files ?? []));

          // Reset the input value so the same file can be uploaded again
          if (ref.current) {
            ref.current.value = "";
          }
        }}
        accept={accept}
      />
    </div>
  )
}
