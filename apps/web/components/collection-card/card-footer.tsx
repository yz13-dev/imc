import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import {
  ReferenceBadge,
  ReferenceButton,
  ReferenceFooter,
  ReferenceFooterGroup
} from "@workspace/ui/components/reference";
import { ArrowUpRightIcon, GlobeIcon } from "lucide-react";
import Link from "next/link";

import { formatDuration } from "@/lib/format-duration";
import { useVideoStore } from "@/lib/stores/video-store";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";

type CardFooterProps = {
  href?: string;
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
      </ReferenceFooterGroup>
      <ReferenceFooterGroup className="min-w-0">
        {!!duration && <ReferenceBadge>{duration}</ReferenceBadge>}
        {href && <ReferenceButton
          nativeButton={false}
          className="lg:group-hover:flex lg:group-focus:flex lg:hidden flex"
          render={<Link href={href} onClick={event => event.stopPropagation()} />}
        >
          <ArrowUpRightIcon />
        </ReferenceButton>}
      </ReferenceFooterGroup>
    </ReferenceFooter>
  );
}
