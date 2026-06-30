import type { AttachmentWithTags } from "./attachments";

export type InboxItem = {
  user_id: string
  attachment_id: string;
  attachment: AttachmentWithTags
  created_at: string;
};
