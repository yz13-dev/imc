"use client"

import { useGlobalStore } from "@/lib/stores/global-store";
import { useUser } from "@/lib/stores/user";
import { cn } from "@workspace/ui/lib/utils";
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
          return (
            <div key={collection.id} className="min-w-48 rounded-sm overflow-clip border relative">
              {
                user &&
                <Link href={`/${user.username}/${collection.id}`} className="absolute inset-0" />
              }
              <div className="w-full">
                <div className="w-full aspect-square relative grid grid-cols-2 grid-rows-2 *:h-full">
                  {
                    attachments.map((item, index) => {
                      const isLast = index === attachments.length - 1
                      return <RefContent key={item.id} mimeType={item.mime_type} className={cn("", isLast && "col-span-full")} {...item} />
                    })
                  }
                </div>
              </div>
              <div className="p-4 w-full flex flex-col gap-y-1">
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
