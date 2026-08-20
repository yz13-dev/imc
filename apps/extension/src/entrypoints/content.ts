import { getSourceData } from "@/utils/source";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4444",
  "https://localhost:4444",
  "https://imc.yz13.dev",
  "https://auth.yz13.dev",
  "https://preview.auth.yz13.dev",
  "https://yz13.dev"
];

const READY_EVENT = "IMC_EXTENSION_READY";
const PING_EVENT = "IMC_EXTENSION_PING";
const TOKEN_EVENT = "IMC_AUTH_TOKEN";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener(async (message) => {
      switch (message.type) {
        case "GET_SOURCE_DATA":
          return getSourceData();

        default:
          return undefined;
      }
    });

    // Слушаем токен только на доверенных origin'ах — на остальных страницах
    // content-script даже не подписывается на эти события.
    if (!ALLOWED_ORIGINS.includes(window.location.origin)) return;

    const announceReady = () => {
      window.postMessage({ type: READY_EVENT }, window.location.origin);
    };

    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window) return;

      if (event.data?.type === PING_EVENT) {
        announceReady();
        return;
      }

      if (event.data?.type !== TOKEN_EVENT) return;
      const token = event.data?.token;
      if (token) {
        browser.runtime.sendMessage({ type: "AUTH_SUCCESS", token });
      }
    });

    announceReady();
  },
});
