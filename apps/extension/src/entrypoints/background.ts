import { USE_TEST } from "@/utils/env";
import { saveTabMedia } from "@/utils/save";

export default defineBackground(() => {
  if (USE_TEST) console.log("USE_TEST is enabled");

  // contextMenus не поддерживается в Firefox для Android — там точки входа
  // для сохранения это long-press (src/utils/long-press.ts) и попап-пикер
  // (src/entrypoints/popup).
  const hasContextMenus = typeof browser.contextMenus !== "undefined";

  function createContextMenu() {
    if (!hasContextMenus) return;
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

    // Фолбэк из контент-скрипта (см. utils/media-context-fallback.ts) —
    // long-press на Android или заблокированное сайтом контекстное меню на
    // десктопе. Сам fetch/upload делаем здесь, а не в контент-скрипте,
    // чтобы не упираться в CSP посещаемой страницы.
    if (message && message.type === "SAVE_FROM_CONTEXT_FALLBACK" && message.srcUrl) {
      const tab = sender.tab;
      if (!tab) {
        sendResponse({ status: "error", step: "fetch" });
        return;
      }
      saveTabMedia(tab, message.srcUrl).then(sendResponse);
      return true;
    }

    return undefined;
  });

  if (hasContextMenus) {
    browser.contextMenus.onClicked.addListener(
      async (info, tab) => {
        if (info.menuItemId !== "save-to-imc") {
          return;
        }
        if (!tab) return;

        const isImageOrVideo = info.mediaType === "image" || info.mediaType === "video";
        if (!isImageOrVideo || !info.srcUrl) return;

        const result = await saveTabMedia(tab, info.srcUrl);
        if (result.status === "error") {
          console.error(`[ ATTACHMENT-${result.step.toUpperCase()}-FAILED ]`, info.srcUrl);
        }
      },
    );
  }
});
