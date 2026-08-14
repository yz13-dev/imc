


export type Attachment = {
  id: string
  card_id: string | null
  type: string
  mime_type: string
  src: string
  width: number
  height: number
  duration_ms: number
  file_size: number
  is_cover: boolean
  blurhash: string
  created_at: Date
  user_id: string
  label: string
  // Many-to-many (collections_attachments has no unique constraint on
  // attachment_id) — an attachment can be in 0, 1, or several collections.
  collection_ids: string[]
}

export type UpdateAttachment = {
  label: string
}

export type Tag = {
  id: string
  user_id: string
  name: string
  created_at: Date
}

export type TagWithCount = Tag & { count: number }

export type AttachmentTag = {
  id: string
  attachment_id: string
  tag_id: string
  created_at: string
  updated_at: string
}
export type AttachmentSource = {
  id: string
  attachment_id: string
  created_at: Date
  updated_at: Date
  domain: Source
}

type Source = {
  id: string
  slug: string
  name: string
  domain: string
  favicon_url: string | null
  created_at: Date
}

type TagsAndSource = {
  tags: (AttachmentTag & { tag: Tag })[]
  source: AttachmentSource | null
}

export type AttachmentWithTags = Attachment & TagsAndSource

export type AttachmentWithMaybeTagsAndSource = AttachmentWithTags & Partial<TagsAndSource>
