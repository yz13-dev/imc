import type { AttachmentWithTags } from "./attachments";

export type InboxItem = {
  user_id: number;
  attachment_id: string;
  attachment: AttachmentWithTags
  created_at: string;
};
