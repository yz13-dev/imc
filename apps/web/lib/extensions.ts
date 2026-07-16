const TRUSTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4444",
  "https://localhost:4444",
  "https://imc.yz13.dev",
  "https://auth.yz13.dev",
  "https://yz13.dev",
];

const READY_EVENT = "IMC_EXTENSION_READY";
const PING_EVENT = "IMC_EXTENSION_PING";
const TOKEN_EVENT = "IMC_AUTH_TOKEN";

// Расширение слушает READY_EVENT только на этих же доверенных origin'ах, так что
// это не защита сама по себе — просто держим проверку симметричной content-script'у
// и не рассылаем токен, если контент-скрипт заведомо не должен быть на странице.
const READY_TIMEOUT_MS = 2000;

export function sendTokenToExtension(token: string) {
  if (!TRUSTED_ORIGINS.includes(window.location.origin)) return;

  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

  const onReady = () => {
    clearTimeout(timeoutId);
    window.removeEventListener(READY_EVENT, onReady);
    window.dispatchEvent(new CustomEvent(TOKEN_EVENT, { detail: { token } }));
  };

  window.addEventListener(READY_EVENT, onReady);
  // Content-script мог объявить готовность до вызова этой функции — просим подтвердить её ещё раз.
  window.dispatchEvent(new CustomEvent(PING_EVENT));

  timeoutId = setTimeout(() => {
    window.removeEventListener(READY_EVENT, onReady);
  }, READY_TIMEOUT_MS);
}
