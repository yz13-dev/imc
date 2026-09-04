
export type Collection = {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  public: boolean
  user_id: string
}

export type PublicCollection = Pick<Collection, "id" | "name" | "description" | "updated_at"> & {
  attachment_count: number
}
