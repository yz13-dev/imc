"use client";
import { cn } from "@workspace/ui/lib/utils";
import { useRef } from "react";
import { CSS_COLUMNS_CLASSNAME } from "./masonry-breakpoints";
import { useMasonryColumns } from "./use-masonry";

export type CardGridWrapperProps = {
  className?: string;
  count: number;
  getAspectRatio: (index: number) => number;
  renderItem: (index: number) => React.ReactNode;
}

export default function CardGridWrapper({ className, count, getAspectRatio, renderItem }: CardGridWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { columns, isMeasured } = useMasonryColumns({ containerRef, count, getAspectRatio });

  return (
    <div ref={containerRef} className={cn("@container", className)}>
      {
        isMeasured
          ? (
            <div className="flex gap-2 items-start">
              {
                columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex flex-1 flex-col gap-2 min-w-0">
                    {column.map((index) => renderItem(index))}
                  </div>
                ))
              }
            </div>
          )
          : (
            <div className={CSS_COLUMNS_CLASSNAME}>
              {
                Array.from({ length: count }, (_, index) => (
                  <div
                    key={index}
                    className="w-full rounded-lg bg-muted animate-pulse break-inside-avoid"
                    style={{ aspectRatio: getAspectRatio(index) }}
                  />
                ))
              }
            </div>
          )
      }
    </div>
  );
}
