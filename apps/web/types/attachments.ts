


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
  user_id: number
  label: string
}

export type Tag = {
  id: string
  user_id: number
  name: string
  created_at: Date
}

export type AttachmentTag = {
  id: string
  attachment_id: string
  tag_id: string
  created_at: string
  updated_at: string
}

type AttachmentSource = {
  id: string
  attachment_id: string
  name: string
  created_at: Date
  domain: string
  favicon_url: string | null
  slug: string
}

export type AttachmentWithTags = Attachment & {
  tags: (AttachmentTag & { tag: Tag })[]
  source: AttachmentSource | null
}
