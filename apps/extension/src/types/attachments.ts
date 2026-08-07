
export type Attachment = {
  id: string;
  type: string;
  mime_type: string;
  src: string;
  width: number;
  height: number;
  duration_ms: number;
  file_size: number;
  is_cover: boolean;
  blurhash: string;
  created_at: string;
  user_id: string;
  label: string;
  is_deleted: boolean;
}
