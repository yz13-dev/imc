import { useEffect, useState } from "react";
import type { PageMediaItem } from "@/utils/media";
import { saveTabMedia, type TabLike } from "@/utils/save";

type ItemState = "idle" | "saving" | "saved" | "signin" | "error";

type LoadState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; items: PageMediaItem[] };

// Запасной способ сохранения там, где long-press (src/utils/long-press.ts)
// недоступен или не сработал — например, картинка на CSS background-image,
// а не в теге <img>. Показывает всё найденное на странице медиа гридом.
export default function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [tab, setTab] = useState<TabLike | null>(null);

  useEffect(() => {
    (async () => {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id || !activeTab.url) {
        setState({ status: "empty" });
        return;
      }
      setTab(activeTab);

      try {
        const media = (await browser.tabs.sendMessage(activeTab.id, {
          type: "GET_PAGE_MEDIA",
        })) as PageMediaItem[];
        if (!media?.length) {
          setState({ status: "empty" });
          return;
        }
        setState({ status: "ready", items: media });
      } catch {
        setState({ status: "empty" });
      }
    })();
  }, []);

  async function save(item: PageMediaItem) {
    if (!tab) return;
    setItemStates((prev) => ({ ...prev, [item.src]: "saving" }));
    const result = await saveTabMedia(tab, item.src);
    setItemStates((prev) => ({
      ...prev,
      [item.src]:
        result.status === "ok" ? "saved" : result.status === "signin-required" ? "signin" : "error",
    }));
  }

  if (state.status === "loading") {
    return (
      <main className="imc-popup">
        <p className="imc-hint">{browser.i18n.getMessage("popupLoading")}</p>
      </main>
    );
  }

  if (state.status === "empty") {
    return (
      <main className="imc-popup">
        <p className="imc-hint">{browser.i18n.getMessage("popupNoMedia")}</p>
      </main>
    );
  }

  return (
    <main className="imc-popup">
      <p className="imc-hint">{browser.i18n.getMessage("popupPickHint")}</p>
      <div className="imc-grid">
        {state.items.map((item) => {
          const itemState = itemStates[item.src] ?? "idle";
          const isBusy = itemState === "saving" || itemState === "saved";
          return (
            <button
              key={item.src}
              type="button"
              className={`imc-item imc-item--${itemState}`}
              onClick={() => save(item)}
              disabled={isBusy}
            >
              {item.type === "image" && <img src={item.src} loading="lazy" alt="" />}
              {item.type === "video" && item.poster && <img src={item.poster} loading="lazy" alt="" />}
              {item.type === "video" && !item.poster && (
                <div className="imc-video-placeholder">▶</div>
              )}
              {item.type === "video" && (
                <span className="imc-badge">{browser.i18n.getMessage("popupVideoBadge")}</span>
              )}
              {itemState === "saving" && <span className="imc-overlay">…</span>}
              {itemState === "saved" && <span className="imc-overlay">✓</span>}
              {itemState === "signin" && <span className="imc-overlay">↗</span>}
              {itemState === "error" && <span className="imc-overlay">!</span>}
            </button>
          );
        })}
      </div>
    </main>
  );
}
