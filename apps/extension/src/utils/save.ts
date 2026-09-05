import { getUser } from "@/utils/auth";
import { APP_URL, USE_TEST } from "@/utils/env";
import { parseImageUrl } from "@/utils/images";
import { checkSource, connectSource, createSource } from "@/utils/source";
import { fetchAttachments, inboxAttachment, uploadAttachment } from "@/utils/attachments";

// Minimal subset of browser.tabs.Tab we actually need — lets background,
// popup, and the long-press message handler all share one signature without
// depending on a specific ambient Tab type.
export type TabLike = {
  id?: number;
  url?: string;
  title?: string;
  favIconUrl?: string;
};

export type SaveOutcome =
  | { status: "signin-required" }
  | { status: "ok" }
  | { status: "error"; step: "fetch" | "upload" };

async function saveMediaToInbox(options: {
  srcUrl: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceFavicon?: string | null;
}): Promise<SaveOutcome> {
  const sourceBaseUrl = new URL(options.sourceUrl).origin;
  const checkedSource = await checkSource({ url: options.sourceUrl });
  const attachmentUrl = parseImageUrl({ url: options.srcUrl, base: sourceBaseUrl });

  const blob = await fetchAttachments(attachmentUrl);
  if (!blob) return { status: "error", step: "fetch" };

  const attachment = await uploadAttachment(blob);
  if (!attachment?.id) return { status: "error", step: "upload" };

  const id = attachment.id;
  if (!USE_TEST) {
    await inboxAttachment(id);
    if (checkedSource?.exist === true) {
      await connectSource({ sourceID: checkedSource.id, attachmentID: id });
    } else {
      const source = await createSource({
        title: options.sourceTitle,
        url: attachmentUrl,
        favicon: options.sourceFavicon || undefined,
        attachment_id: id,
      });
      if (source) {
        await connectSource({ sourceID: source.id, attachmentID: id });
      }
    }
  }
  return { status: "ok" };
}

// Shared save entry point for the desktop context menu, the Android
// long-press handler, and the popup media picker — resolves auth (opening
// sign-in if needed), the source page, and saves one media URL to the inbox.
export async function saveTabMedia(tab: TabLike, srcUrl: string): Promise<SaveOutcome> {
  if (!tab.url) return { status: "error", step: "fetch" };
  const url = new URL(tab.url);

  const { status, data: user } = await getUser();
  if (status !== 200 || !user) {
    browser.tabs.create({ url: `${APP_URL}/auth/signin?next=${url.toString()}` });
    return { status: "signin-required" };
  }

  const sourceTitle = tab.title || url.hostname;
  let sourceFavicon = tab.favIconUrl?.startsWith("data:") ? null : tab.favIconUrl;
  if (!sourceFavicon && tab.id != null) {
    const response = await browser.tabs.sendMessage(tab.id, { type: "GET_SOURCE_DATA" }).catch(() => null);
    sourceFavicon = response?.favicon ?? null;
  }

  return saveMediaToInbox({
    srcUrl,
    sourceUrl: url.toString(),
    sourceTitle,
    sourceFavicon,
  });
}
