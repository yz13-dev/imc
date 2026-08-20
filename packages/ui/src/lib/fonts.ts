import localFont from "next/font/local"

export const sans = localFont({
  src: [
    { path: "./fonts/onest-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/onest-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/onest-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/onest-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  preload: true,
  fallback: ["system-ui", "Inter", "sans-serif"],
})

export const pixel = localFont({
  src: "./fonts/geist-pixel-square.woff2",
  variable: "--font-pixel",
  display: "optional",
  preload: false,
  fallback: ["system-ui"],
})

export const mono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "optional",
  preload: false,
  fallback: ["mono"],
})

export const serif = localFont({
  src: [
    { path: "./fonts/lora-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/lora-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/lora-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/lora-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "optional",
  preload: false,
  fallback: ["serif"],
})
