const TOAST_ID = "imc-context-fallback-toast";

function isTouchContextMenu(event: MouseEvent): boolean {
  const pointerType = (event as PointerEvent).pointerType;
  if (pointerType) return pointerType === "touch";
  // Легаси-фолбэк для Gecko (MOZ_SOURCE_TOUCH = 5) на случай, если сборка
  // Firefox ещё не отдаёт pointerType на contextmenu.
  const mozInputSource = (event as unknown as { mozInputSource?: number })
    .mozInputSource;
  return mozInputSource === 5;
}

function findMediaTarget(
  target: EventTarget | null,
): HTMLImageElement | HTMLVideoElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("img, video") as
    | HTMLImageElement
    | HTMLVideoElement
    | null;
}

function findMediaAtPoint(
  x: number,
  y: number,
): HTMLImageElement | HTMLVideoElement | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const media = findMediaTarget(element);
    if (media) return media;
  }

  // An overlay can completely hide the media from `elementsFromPoint`.
  // Fall back to rendered media whose bounding box contains the touch.
  const candidates = Array.from(
    document.querySelectorAll<HTMLImageElement | HTMLVideoElement>(
      "img, video",
    ),
  );
  return (
    candidates
      .filter((media) => {
        const rect = media.getBoundingClientRect();
        return (
          rect.width > 1 &&
          rect.height > 1 &&
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        );
      })
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return aRect.width * aRect.height - bRect.width * bRect.height;
      })[0] ?? null
  );
}

function getMediaUrl(media: HTMLImageElement | HTMLVideoElement): string {
  return media.currentSrc || media.src;
}

function removeToast() {
  document.getElementById(TOAST_ID)?.remove();
}

function showMediaMenu(
  media: HTMLImageElement | HTMLVideoElement,
  label: string,
  onTap: () => void,
): HTMLButtonElement {
  removeToast();

  const host = document.createElement("div");
  host.id = TOAST_ID;
  host.style.cssText = `
    all: initial;
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: block;
  `;
  const shadow = host.attachShadow({ mode: "open" });
  const rect = media.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  const backdrop = document.createElement("div");
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.style.cssText = `
    all: initial;
    box-sizing: border-box;
    position: fixed;
    inset: 0;
    touch-action: none;
  `;

  const mediaTop = Math.max(0, rect.top);
  const mediaBottom = Math.min(viewportHeight, rect.bottom);
  const mediaLeft = Math.max(0, rect.left);
  const mediaRight = Math.min(viewportWidth, rect.right);
  const blurPaneStyle = `
    all: initial;
    position: fixed;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    pointer-events: none;
  `;
  const blurPanes = [
    `inset: 0 0 auto 0; height: ${mediaTop}px;`,
    `inset: ${mediaBottom}px 0 0 0;`,
    `left: 0; top: ${mediaTop}px; width: ${mediaLeft}px; height: ${Math.max(0, mediaBottom - mediaTop)}px;`,
    `left: ${mediaRight}px; right: 0; top: ${mediaTop}px; height: ${Math.max(0, mediaBottom - mediaTop)}px;`,
  ].map((position) => {
    const pane = document.createElement("div");
    pane.style.cssText = `${blurPaneStyle}${position}`;
    return pane;
  });

  const menuWidth = Math.min(
    Math.max(rect.width, 180),
    420,
    viewportWidth - 32,
  );
  const menuLeft = Math.min(
    Math.max(rect.left, 16),
    Math.max(16, viewportWidth - menuWidth - 16),
  );
  const menuTop = Math.min(rect.bottom + 8, viewportHeight - 60);

  const menu = document.createElement("div");
  menu.setAttribute("role", "menu");
  menu.style.cssText = `
    all: initial;
    box-sizing: border-box;
    position: fixed;
    left: ${menuLeft}px;
    top: ${Math.max(8, menuTop)}px;
    width: ${menuWidth}px;
    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    background: rgba(24, 24, 24, 0.78);
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.32);
    backdrop-filter: blur(24px) saturate(150%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
  `;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("role", "menuitem");
  button.textContent = label;
  button.style.cssText = `
    all: unset;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    min-height: 44px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 7px;
    color: white;
    font: 500 15px/1.4 system-ui, sans-serif;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  `;

  function cleanup() {
    removeToast();
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onTap();
  });
  button.addEventListener("pointerdown", () => {
    button.style.background = "rgba(255, 255, 255, 0.12)";
  });
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) cleanup();
  });
  shadow.addEventListener("keydown", (event) => {
    if ((event as KeyboardEvent).key === "Escape") cleanup();
  });

  menu.appendChild(button);
  backdrop.append(...blurPanes, menu);
  shadow.appendChild(backdrop);
  document.documentElement.appendChild(host);
  button.focus();
  return button;
}

async function handleSave(toast: HTMLButtonElement, srcUrl: string) {
  toast.textContent = browser.i18n.getMessage("popupSaving");
  toast.disabled = true;
  try {
    const response = await browser.runtime.sendMessage({
      type: "SAVE_FROM_CONTEXT_FALLBACK",
      srcUrl,
    });
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
  let longPressTimer: number | undefined;
  let longPressStart: { pointerId: number; x: number; y: number } | undefined;
  let lastToastAt = 0;

  function clearLongPress() {
    window.clearTimeout(longPressTimer);
    longPressTimer = undefined;
    longPressStart = undefined;
  }

  function showSaveToast(media: HTMLImageElement | HTMLVideoElement) {
    const srcUrl = getMediaUrl(media);
    if (!srcUrl) return;

    lastToastAt = Date.now();
    const toast = showMediaMenu(
      media,
      browser.i18n.getMessage("contextMenuSave"),
      () => handleSave(toast, srcUrl),
    );
  }

  function startLongPress(pointerId: number, x: number, y: number) {
    const media = findMediaAtPoint(x, y);
    if (!media) return;

    clearLongPress();
    longPressStart = { pointerId, x, y };
    longPressTimer = window.setTimeout(() => {
      const start = longPressStart;
      clearLongPress();
      if (!start) return;
      showSaveToast(media);
    }, 450);
  }

  // Firefox Android does not consistently emit `contextmenu` for a long
  // press. Track the touch pointer as well. `elementsFromPoint` is used
  // because sites such as Pinterest place clickable overlays above images.
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch" || !event.isPrimary) return;

      startLongPress(event.pointerId, event.clientX, event.clientY);
    },
    true,
  );

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!longPressStart || event.pointerId !== longPressStart.pointerId)
        return;
      if (
        Math.hypot(
          event.clientX - longPressStart.x,
          event.clientY - longPressStart.y,
        ) > 12
      ) {
        clearLongPress();
      }
    },
    true,
  );
  document.addEventListener("pointerup", clearLongPress, true);
  document.addEventListener("pointercancel", clearLongPress, true);

  // Some Firefox Android pages expose touch events but no usable pointer
  // events to content scripts.
  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      startLongPress(touch.identifier, touch.clientX, touch.clientY);
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    "touchmove",
    (event) => {
      if (!longPressStart || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (
        !touch ||
        Math.hypot(
          touch.clientX - longPressStart.x,
          touch.clientY - longPressStart.y,
        ) > 12
      ) {
        clearLongPress();
      }
    },
    { capture: true, passive: true },
  );
  document.addEventListener("touchend", clearLongPress, true);
  document.addEventListener("touchcancel", clearLongPress, true);

  document.addEventListener("contextmenu", (event) => {
    const media =
      findMediaTarget(event.target) ||
      findMediaAtPoint(event.clientX, event.clientY);
    if (!media) return;

    const touch = isTouchContextMenu(event);
    const blockedBySite = event.defaultPrevented;
    if (!touch && !blockedBySite) return; // обычный десктопный правый клик — отдаём нативному меню

    if (!event.defaultPrevented) event.preventDefault();

    clearLongPress();
    if (Date.now() - lastToastAt < 1000) return;

    showSaveToast(media);
  });
}
