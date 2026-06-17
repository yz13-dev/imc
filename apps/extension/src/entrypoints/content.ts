import { getSourceData } from "@/utils/source";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("IMC Here")
    browser.runtime.onMessage.addListener(async (message) => {
      console.log("MESSAGE RECEIVED", message);
      switch (message.type) {
        case "GET_SOURCE_DATA":
          return getSourceData();

        default:
          return undefined;
      }
    });

    window.addEventListener("IMC_AUTH_TOKEN", (event: any) => {
      // ИНЖЕНЕРНАЯ ЗАЩИТА: Проверяем, что событие сработало именно на нашем домене
      const currentOrigin = window.location.origin;
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yz13.dev"
      ];

      if (!allowedOrigins.includes(currentOrigin)) {
        console.warn("Попытка отправить токен с недоверенного origin:", currentOrigin);
        return;
      }

      // Достаем токен из деталей события
      const token = event.detail?.token;

      if (token) {
        console.log("Токен пойман в контент-скрипте, пересылаем в Background...");

        browser.runtime.sendMessage({ type: "AUTH_SUCCESS", token: token });
      }
    });

  },
});
