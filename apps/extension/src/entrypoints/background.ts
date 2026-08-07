import { getUser } from "@/utils/auth";
import { APP_URL, USE_TEST } from "@/utils/env";
import { parseImageUrl } from "@/utils/images";

export default defineBackground(() => {
  if (USE_TEST) console.log("USE_TEST is enabled");
  function createContextMenu() {
    browser.contextMenus.create({
      id: "save-to-imc",
      title: browser.i18n.getMessage("contextMenuSave"),
      contexts: ["image", "video"],
    }, () => {
      // Отлавливаем возможные ошибки дублирования id в консоли
      if (browser.runtime.lastError) {
        console.log("Контекстное меню уже создано или произошла ошибка:", browser.runtime.lastError.message);
      }
    });
  }
  // Пункты контекстного меню не сохраняются между перезапусками браузера
  // и service worker'а, поэтому создаём меню прямо при выполнении
  // background-скрипта — оно выполняется заново при установке,
  // старте браузера и каждом пробуждении service worker'а (MV3).
  createContextMenu();
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
          url: `${APP_URL}/auth/signin?next=${url.toString()}`,
        });
        return;
      }

      const sourceTitle = tab?.title

      const sourceUrl = url.toString()
      const sourceBaseUrl = url.origin

      let sourceFavicon = tab?.favIconUrl?.startsWith("data:") ? null : tab?.favIconUrl;
      if (!sourceFavicon && tab.id) {
        const response = await browser.tabs.sendMessage(tab.id!, {
          type: "GET_SOURCE_DATA",
        });
        sourceFavicon = response?.favicon;
      }

      if (info.srcUrl) {
        const checkedSource = await checkSource({ url: sourceUrl })
        const attachmentUrl = parseImageUrl({ url: info.srcUrl, base: sourceBaseUrl })
        if (USE_TEST) console.log("attachmentUrl", attachmentUrl)
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

        if (id && !USE_TEST) {
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
