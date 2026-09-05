export type PageMediaItem = {
  src: string;
  type: "image" | "video";
  width?: number;
  height?: number;
  poster?: string | null;
};

// Ниже этого размера считаем картинку иконкой/спрайтом, а не референсом.
const MIN_DIMENSION = 64;

// Собирает изображения и видео со страницы — используется попапом для
// выбора медиа там, где нет контекстного меню (Firefox для Android).
export function getPageMedia(): PageMediaItem[] {
  const seen = new Set<string>();
  const items: PageMediaItem[] = [];

  document.querySelectorAll("img").forEach((img) => {
    const src = img.currentSrc || img.src;
    if (!src || seen.has(src)) return;
    if (
      img.naturalWidth > 0 &&
      img.naturalHeight > 0 &&
      img.naturalWidth < MIN_DIMENSION &&
      img.naturalHeight < MIN_DIMENSION
    ) {
      return;
    }
    seen.add(src);
    items.push({
      src,
      type: "image",
      width: img.naturalWidth || undefined,
      height: img.naturalHeight || undefined,
    });
  });

  document.querySelectorAll("video").forEach((video) => {
    const nestedSource = video.querySelector("source")?.src;
    const src = video.currentSrc || video.src || nestedSource;
    if (!src || seen.has(src)) return;
    seen.add(src);
    items.push({
      src,
      type: "video",
      width: video.videoWidth || undefined,
      height: video.videoHeight || undefined,
      poster: video.poster || null,
    });
  });

  return items;
}
