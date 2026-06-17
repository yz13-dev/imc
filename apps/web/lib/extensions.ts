
export function sendTokenToExtension(token: string) {
  // Проверяем, доступны ли API расширений в текущем браузере
  // Создаем кастомное событие и передаем токен в поле detail
  const authEvent = new CustomEvent("IMC_AUTH_TOKEN", {
    detail: { token }
  });

  // Стреляем событием в окно браузера. Контент-скрипт расширения его тут же услышит.
  window.dispatchEvent(authEvent);

  console.log("Событие отправки токена сгенерировано на сайте!");
}
