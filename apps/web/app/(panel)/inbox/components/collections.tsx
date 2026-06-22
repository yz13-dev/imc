"use client"

import { useGlobalStore } from "@/lib/stores/global-store";
import { cn } from "@workspace/ui/lib/utils";
import RefContent from "../../components/ref-content";


export default function Collections() {

  const collections = useGlobalStore((store) => store.collections)
  const items = useGlobalStore((state) => state.collectionsItems)

  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      {
        collections.map(collection => {
          const attachments = (items[collection.id] || []).slice(0, 3)
          return (
            <div key={collection.id} className="min-w-48 rounded-sm py-4 border">
              <div className="px-4 w-full">
                <div className="w-full aspect-square relative grid grid-cols-2 grid-rows-2 *:h-full">
                  {
                    attachments.map((item, index) => {
                      const isLast = index === attachments.length - 1
                      return <RefContent key={item.id} mimeType={item.mime_type} className={cn("", isLast && "col-span-full")} {...item} />
                    })
                  }
                </div>
              </div>
              <div className="px-4 w-full">
                <span className="text-sm">{collection.name}</span>
              </div>
            </div>
          )
        })
      }
    </div>
  );
}
