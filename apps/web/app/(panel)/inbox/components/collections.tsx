"use client"
import { getCollections } from "@/lib/api/collections";
import { useSuspenseQuery } from "@tanstack/react-query";
import CollectionCard, { CollectionCardSkeleton } from "./collection-card";

export function CollectionsSkeleton() {
  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      <CollectionCardSkeleton />
      <CollectionCardSkeleton />
      <CollectionCardSkeleton />
      <CollectionCardSkeleton />
      <CollectionCardSkeleton />
    </div>
  )
}

export default function Collections() {

  const { data, isLoading } = useSuspenseQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  if (isLoading) return <CollectionsSkeleton />
  return (
    <div className="flex items-center gap-3 [&_div]:shrink-0 overflow-x-auto">
      {
        (data || []).map(item => (
          <CollectionCard key={item.id} collection={item} />
        ))
      }
    </div>
  );
}
