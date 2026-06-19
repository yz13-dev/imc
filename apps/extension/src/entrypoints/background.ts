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

    console.log("[ MESSAGE ]", message)
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

      const url = new URL(tab!.url!);
      const { status, data: user } = await getUser();
      console.log("[ USER ]", user)
      if (status !== 200 || !user) {
        browser.tabs.create({
          url: `http://localhost:5173/auth/signin?next=${url.toString()}`,
        });
        return;
      }

      const sourceTitle = tab?.title

      const sourceUrl = url.toString()

      let sourceFavicon = tab?.favIconUrl?.startsWith("data:") ? null : tab?.favIconUrl;
      console.log("[ FAVICON ]", sourceFavicon)
      if (!sourceFavicon && tab.id) {
        const response = await browser.tabs.sendMessage(tab.id!, {
          type: "GET_SOURCE_DATA",
        });
        console.log("[ SOURCE-DATA ]", response);
        sourceFavicon = response?.favicon;
      }

      // const source = {
      //   title: sourceTitle,
      //   url: sourceUrl,
      //   favicon: sourceFavicon,
      // }


      // const filenameArray = (new URL(info?.srcUrl || "").pathname)?.split("/")
      // const filename = filenameArray?.[filenameArray.length - 1];

      // const attachment = {
      //   src: info?.srcUrl,
      //   title: `${sourceTitle} - ${filename}`,
      //   filename,
      // }

      if (info.srcUrl) {

        const checkedSource = await checkSource({ url: sourceUrl })
        console.log("[ SOURCE ]", sourceUrl)
        console.log("[ EXIST ]", checkedSource?.exist)
        // console.log("checkedSource", checkedSource, sourceUrl)

        const attachmentUrl = parseImageUrl(info.srcUrl)
        console.log("[ CLEARED-ATTACHMENT-URL ]", attachmentUrl)

        const blob = await fetchAttachments(attachmentUrl)
        const attachment = await uploadAttachment(blob)
        if (attachment) console.log("[ ATTACHMENT-UPLOADED ]", !!attachment)
        // console.log("attachment", attachment)

        const id = attachment.id

        if (id) {
          if (checkedSource?.exist === true) {
            console.log("[ CONNECT ]", checkedSource.id, id)
            await connectSource({ sourceID: checkedSource.id, attachmentID: id })
          } else {
            console.log("[ CREATE ]", sourceTitle || url.hostname, attachmentUrl)
            const source = await createSource({ title: sourceTitle || url.hostname, url: attachmentUrl, favicon: sourceFavicon || undefined, attachment_id: id })
            if (source) {
              console.log("[ CONNECT ]", source.id, id)
              await connectSource({ sourceID: source.id, attachmentID: id })
            }
          }
        }
      }


      // console.log("favicon", sourceFavicon)
      // console.log("source", source)
      // console.log(attachment);
    },
  );
});
