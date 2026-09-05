const TOAST_ID = "imc-context-fallback-toast";

function isTouchContextMenu(event: MouseEvent): boolean {
  const pointerType = (event as PointerEvent).pointerType;
  if (pointerType) return pointerType === "touch";
  // Легаси-фолбэк для Gecko (MOZ_SOURCE_TOUCH = 5) на случай, если сборка
  // Firefox ещё не отдаёт pointerType на contextmenu.
  const mozInputSource = (event as unknown as { mozInputSource?: number }).mozInputSource;
  return mozInputSource === 5;
}

function findMediaTarget(target: EventTarget | null): HTMLImageElement | HTMLVideoElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("img, video") as HTMLImageElement | HTMLVideoElement | null;
}

function removeToast() {
  document.getElementById(TOAST_ID)?.remove();
}

function showToast(x: number, y: number, label: string, onTap: () => void): HTMLButtonElement {
  removeToast();

  const toast = document.createElement("button");
  toast.id = TOAST_ID;
  toast.type = "button";
  toast.textContent = label;
  toast.style.cssText = `
    all: initial;
    position: fixed;
    left: ${x}px;
    top: ${Math.max(y, 8)}px;
    transform: translate(-50%, -110%);
    z-index: 2147483647;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    font: 13px/1.2 system-ui, sans-serif;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  `;

  function cleanup() {
    window.clearTimeout(timeoutId);
    document.removeEventListener("pointerdown", dismiss, true);
    removeToast();
  }
  function dismiss(event: Event) {
    if (event.target === toast) return;
    cleanup();
  }

  toast.addEventListener("click", (event) => {
    event.stopPropagation();
    onTap();
  });
  document.addEventListener("pointerdown", dismiss, true);
  const timeoutId = window.setTimeout(cleanup, 5000);

  document.documentElement.appendChild(toast);
  return toast;
}

async function handleSave(toast: HTMLButtonElement, srcUrl: string) {
  toast.textContent = browser.i18n.getMessage("popupSaving");
  toast.disabled = true;
  try {
    const response = await browser.runtime.sendMessage({ type: "SAVE_FROM_CONTEXT_FALLBACK", srcUrl });
    if (response?.status === "ok") {
      toast.textContent = browser.i18n.getMessage("popupSaved");
    } else if (response?.status === "signin-required") {
      toast.textContent = browser.i18n.getMessage("popupSignInOpened");
    } else {
      toast.textContent = browser.i18n.getMessage("popupError");
    }
  } catch {
    toast.textContent = browser.i18n.getMessage("popupError");
  }
  window.setTimeout(removeToast, 1500);
}

// Заменяет собой browser.contextMenus в двух случаях, когда он недоступен
// или бесполезен:
//  1. Firefox для Android — API contextMenus там не существует вообще, а
//     contextmenu стреляет на long-press как обычное DOM-событие (так сайты
//     реализуют свои тач-меню).
//  2. Десктоп, но сайт сам подавил нативное контекстное меню через
//     event.preventDefault() на contextmenu (частый приём на дизайн-сайтах,
//     чтобы мешать сохранению картинок) — тогда пункт "Save to IMC" из
//     contextMenus тоже не показывается, т.к. он часть того же меню.
//
// Слушаем в фазе всплытия (не capture), а не namespace, чтобы обработчик
// сайта (обычно навешанный раньше, при парсинге страницы) успел отработать
// первым и выставить event.defaultPrevented — так мы понимаем, что нативное
// меню в любом случае не покажется, и включаем свой toast.
export function setupMediaContextFallback() {
  document.addEventListener("contextmenu", (event) => {
    const media = findMediaTarget(event.target);
    if (!media) return;

    const touch = isTouchContextMenu(event);
    const blockedBySite = event.defaultPrevented;
    if (!touch && !blockedBySite) return; // обычный десктопный правый клик — отдаём нативному меню

    const srcUrl = media.currentSrc || media.src;
    if (!srcUrl) return;

    if (!event.defaultPrevented) event.preventDefault();

    const rect = media.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top;

    const toast = showToast(x, y, browser.i18n.getMessage("contextMenuSave"), () => handleSave(toast, srcUrl));
  });
}
