
"use client"

import { useGlobalStore } from "@/lib/stores/global-store"
import { useUser } from "@/lib/stores/user"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { LockIcon, LockOpenIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"


type CollectionSelectProps = {
  defaultCollection?: string
}

export default function CollectionSelect({ defaultCollection }: CollectionSelectProps) {

  const user = useUser((state) => state.user)
  const [collectionId, setCollectionId] = useState<string | null>(defaultCollection || null)
  const collections = useGlobalStore((state) => state.collections)

  const collection = collections.find(collection => collection.id === collectionId)

  return (
    <Select
      value={collectionId}
      onValueChange={state => setCollectionId(state)}
      defaultValue={defaultCollection}
      itemToStringLabel={item => {
        return collections.find(collection => collection.id === item)?.name || item
      }}
    >
      <SelectTrigger>
        {collection?.public ? <LockOpenIcon /> : <LockIcon />}
        <SelectValue placeholder="Коллекция" />
      </SelectTrigger>
      <SelectContent>
        {
          collections
            .map(collection => {
              return (
                <SelectItem
                  key={collection.id}
                  value={collection.id}
                  render={<Link href={`/${user?.username || ""}/${collection.id}`} />}
                >
                  {collection?.public ? <LockOpenIcon /> : <LockIcon />}
                  <span>{collection.name}</span>
                </SelectItem>
              )
            })
        }
      </SelectContent>
    </Select>
  )
}
