import type { AttachmentTag, Tag } from "@/types/attachments";


export type TagStats = Record<string, { tag: (AttachmentTag & { tag: Tag }), count: number }>;

export function getTagsStats(tags: (AttachmentTag & { tag: Tag })[]): TagStats {
  const tagCounts: TagStats = {};

  tags.forEach(tag => {
    const tagName = tag.tag.name;
    if (!tagCounts[tagName]) {
      tagCounts[tagName] = { tag: tag, count: 0 };
    }
    tagCounts[tagName].count++;
  });

  return tagCounts;
}
