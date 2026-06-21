"use client"

import { useGlobalStore } from "@/lib/global-store";


export default function Collections() {
  const collections = useGlobalStore((store) => store.collections)

  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      {
        collections.map(collection => {
          return (
            <div key={collection.id} className="min-w-48 rounded-sm py-4 border">
              <div className="px-4 w-full">
                <div className="w-full aspect-square"></div>
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
