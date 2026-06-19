import { decode } from "blurhash";
import { PNG } from "pngjs";

export function toBlurDataURL(hash: string, mime?: string): string {
  const width = 32;
  const height = 32;

  const pixels = decode(hash, width, height);

  const png = new PNG({ width, height });
  png.data = Buffer.from(pixels);

  const buffer = PNG.sync.write(png);

  const defaultMime = "image/png";
  const resolvedMime = mime ?? defaultMime;
  return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
}
