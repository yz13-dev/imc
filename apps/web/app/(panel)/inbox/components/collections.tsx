"use client"

import { OptionalVideoProvider } from "@/components/video-provider";
import { useGlobalStore } from "@/lib/stores/global-store";
import { useUser } from "@/lib/stores/user";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import RefContent from "../../components/ref-content";


export default function Collections() {

  const user = useUser((state) => state.user)
  const collections = useGlobalStore((store) => store.collections)
  const items = useGlobalStore((state) => state.collectionsItems)


  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      {
        collections.map(collection => {
          const attachments = (items[collection.id] || []).slice(0, 3)
          const href = `/${user?.username}/${collection?.id}`
          return (
            <div key={collection.id} className="min-w-48 rounded-sm overflow-clip p-2 bg-muted relative">
              {/*
                user &&
                <Link href={href} className="absolute z-10 inset-0" />
              */}
              <div className="w-full">
                <div className="w-full aspect-square relative gap-2 grid grid-cols-2 grid-rows-2 *:h-full">
                  {
                    attachments
                      .toSorted((a, b) => {
                        if (a.mime_type.startsWith("video/") && b.mime_type.startsWith("image/")) return 1
                        if (a.mime_type.startsWith("image/") && b.mime_type.startsWith("video/")) return -1
                        return 0
                      })
                      .map((item, index) => {
                        const isLast = index === attachments.length - 1
                        return (
                          <OptionalVideoProvider key={item.id} duration={item.duration_ms}>
                            <RefContent
                              mimeType={item.mime_type}
                              className={cn(
                                "rounded-sm [&_img]:rounded-sm [&_video]:rounded-sm border",
                                "nth-[1]:hover:rotate-6 nth-[2]:hover:-rotate-6 nth-[3]:hover:rotate-3 will-change-transform transition-transform",
                                isLast && "col-span-full"
                              )}
                              {...item}
                            />
                          </OptionalVideoProvider>
                        )
                      })
                  }
                </div>
              </div>
              <div className="absolute bottom-4 left-0 px-4 z-10 w-full flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <Badge className="h-6 bg-foreground/50 border-foreground/50 text-background backdrop-blur-3xl">
                    {collection.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className="h-6 bg-foreground/50 border-foreground/50 text-background backdrop-blur-3xl">
                    {attachments.length}
                  </Badge>
                  {
                    user &&
                    <Button size="icon-xs" className="bg-foreground/50 border-foreground/50 text-background backdrop-blur-md" nativeButton={false} render={<Link href={href} />}>
                      <ArrowUpRightIcon />
                    </Button>
                  }
                </div>
              </div>
              <div className="py-2 hidden w-full flex flex-col gap-y-1">
                <span className="text-sm">{collection.name}</span>
                <span className="text-xs text-muted-foreground">
                  {attachments.length} файл{attachments.length !== 1 ? 'а' : ''}
                </span>
              </div>
            </div>
          )
        })
      }
    </div>
  );
}
