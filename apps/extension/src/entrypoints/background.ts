import { fetchAttachments, uploadAttachment } from "@/utils/attachments";
import { getUser } from "@/utils/auth";

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

    console.log(message)
    // Проверяем тип сообщения, которое прислал наш контент-скрипт
    if (message && message.type === "AUTH_SUCCESS" && message.token) {

      // Сохраняем токен во внутреннюю безопасную память расширения
      browser.storage.local.set({ imc_token: message.token }, () => {
        console.log("Ура! Токен сохранен внутри расширения.");

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

      const { status, data: user } = await getUser();
      console.log("user", user)
      if (status !== 200 || !user) {
        browser.tabs.create({
          url: "http://localhost:5173/auth/signin",
        });
        return;
      }

      const sourceTitle = tab?.title

      const url = new URL(tab!.url!);
      const sourceUrl = url.toString()

      let sourceFavicon = tab?.favIconUrl?.startsWith("data:") ? null : tab?.favIconUrl;
      console.log("sourceFavicon", sourceFavicon, tab.id)
      if (!sourceFavicon && tab.id) {
        const response = await browser.tabs.sendMessage(tab.id!, {
          type: "GET_SOURCE_DATA",
        });
        console.log("response", response);
        sourceFavicon = response?.favicon;
      }

      const source = {
        title: sourceTitle,
        url: sourceUrl,
        favicon: sourceFavicon,
      }

      const filenameArray = (info?.srcUrl || "")?.split("/")
      const filename = filenameArray?.[filenameArray.length - 1];

      const attachment = {
        src: info?.srcUrl,
        title: `${sourceTitle} - ${filename}`,
        filename,
      }

      if (info.srcUrl) {
        const blob = await fetchAttachments(info.srcUrl)
        const attachment = await uploadAttachment(blob)
        console.log("attachment", attachment)
      }

      console.log("favicon", sourceFavicon)
      console.log("source", source)
      console.log(attachment);
    },
  );
});
