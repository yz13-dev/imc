


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
