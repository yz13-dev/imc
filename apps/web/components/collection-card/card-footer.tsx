import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import {
  ReferenceBadge,
  ReferenceButton,
  ReferenceFooter,
  ReferenceFooterGroup,
  ReferenceLabel,
} from "@workspace/ui/components/reference";
import { ArrowUpRightIcon, GlobeIcon } from "lucide-react";
import Link from "next/link";

import { formatDuration } from "@/lib/format-duration";
import { useVideoStore } from "@/lib/stores/video-store";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";

type CardFooterProps = {
  href: string;
  duration_ms: AttachmentWithMaybeTagsAndSource["duration_ms"];
  source: AttachmentWithMaybeTagsAndSource["source"];
  label: AttachmentWithMaybeTagsAndSource["label"];
};
export default function CardFooter({
  source,
  duration_ms,
  label,
  href,
}: CardFooterProps) {
  // const isVideo = mime_type.startsWith("video/")
  //
  const position = useVideoStore((state) => state.position);

  const duration = duration_ms ? formatDuration(duration_ms - Math.floor(position * 1000)) : null;

  return (
    <ReferenceFooter>
      <ReferenceFooterGroup className="min-w-0">
        {source && (
          <Avatar className="size-5 rounded-full overflow-clip *:rounded-full after:rounded-full">
            <AvatarImage src={source.domain.favicon_url || undefined} />
            <AvatarFallback>
              <GlobeIcon />
            </AvatarFallback>
          </Avatar>
        )}
        {!!label.length && (
          <ReferenceLabel className="min-w-0 max-w-full flex-1 h-6">
            <span className="min-w-0 flex-1 truncate" title={label}>
              {label}
            </span>
          </ReferenceLabel>
        )}
      </ReferenceFooterGroup>
      <ReferenceFooterGroup className="min-w-0">
        {!!duration && <ReferenceBadge>{duration}</ReferenceBadge>}
        <ReferenceButton nativeButton={false} render={<Link href={href} />}>
          <ArrowUpRightIcon />
        </ReferenceButton>
      </ReferenceFooterGroup>
    </ReferenceFooter>
  );
}
