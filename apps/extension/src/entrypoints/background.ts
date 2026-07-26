import { getUser } from "@/utils/auth";
import { parseImageUrl } from "@/utils/images";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    browser
      .contextMenus
      .create({
        id: "save-to-imc",
        title: "Сохранить в IMC",
        contexts: ["image", "video"],
      });
  });
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Проверяем тип сообщения, которое прислал наш контент-скрипт
    if (message && message.type === "AUTH_SUCCESS" && message.token) {

      // Сохраняем токен во внутреннюю безопасную память расширения
      browser.storage.local.set({ imc_token: message.token }, () => {
        // Опционально: отправляем ответ назад контент-скрипту, если нужно
        sendResponse({ success: true });
      });

      return true; // Держим канал связи открытым для асинхронного ответа
    }
  });
  browser.contextMenus.onClicked.addListener(
    async (info, tab) => {
      if (info.menuItemId !== "save-to-imc") {
        return;
      }
      if (!tab) return;

      const isImageOrVideo = info.mediaType === "image" || info.mediaType === "video";
      if (!isImageOrVideo) return;

      const url = new URL(tab!.url!);
      const { status, data: user } = await getUser();
      if (status !== 200 || !user) {
        browser.tabs.create({
          url: `${import.meta.env.WXT_APP_URL}/auth/signin?next=${url.toString()}`,
        });
        return;
      }

      const sourceTitle = tab?.title

      const sourceUrl = url.toString()

      let sourceFavicon = tab?.favIconUrl?.startsWith("data:") ? null : tab?.favIconUrl;
      if (!sourceFavicon && tab.id) {
        const response = await browser.tabs.sendMessage(tab.id!, {
          type: "GET_SOURCE_DATA",
        });
        sourceFavicon = response?.favicon;
      }

      if (info.srcUrl) {
        const checkedSource = await checkSource({ url: sourceUrl })
        const attachmentUrl = parseImageUrl(info.srcUrl)

        const blob = await fetchAttachments(attachmentUrl)
        if (!blob) {
          console.error("[ ATTACHMENT-FETCH-FAILED ]", attachmentUrl)
          return
        }

        const attachment = await uploadAttachment(blob)
        if (!attachment) {
          console.error("[ ATTACHMENT-UPLOAD-FAILED ]", attachmentUrl)
          return
        }

        const id = attachment.id

        if (id) {
          await inboxAttachment(id)
          if (checkedSource?.exist === true) {
            await connectSource({ sourceID: checkedSource.id, attachmentID: id })
          } else {
            const source = await createSource({ title: sourceTitle || url.hostname, url: attachmentUrl, favicon: sourceFavicon || undefined, attachment_id: id })
            if (source) {
              await connectSource({ sourceID: source.id, attachmentID: id })
            }
          }
        }
      }
    },
  );
});
