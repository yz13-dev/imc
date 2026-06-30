import QueryTheme from "@/components/query-theme";
import { ThemeProvider } from "@/components/theme-provider";
import QueryProvider from "@/providers/query";
import { Toaster } from "@workspace/ui/components/sonner";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import "@workspace/ui/globals.css";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";


const sans = localFont({
  src: [
    { path: "./fonts/golos-text-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/golos-text-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/golos-text-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/golos-text-700.woff2", weight: "700", style: "normal" },
    // { path: "./fonts/google-sans-regular.woff2", weight: "400", style: "normal" },
    // { path: "./fonts/google-sans-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Inter", "sans-serif"],
});

const pixel = localFont({
  src: "./fonts/geist-pixel-square.woff2",
  variable: "--font-pixel",
  display: "optional",
  preload: false,
  fallback: ["system-ui"],
});
const mono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "optional",
  preload: false,
  fallback: ["mono"],
});
const serif = localFont({
  src: [
    { path: "./fonts/playfair-display-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/playfair-display-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/playfair-display-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/playfair-display-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/playfair-display-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/playfair-display-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-serif",
  display: "optional",
  preload: false,
  fallback: ["serif"],
});

export const metadata: Metadata = {
  title: "IMC | Хранилище ваших вдохновлений",
  description: "IMC — это онлайн-репозиторий для хранения и управления коллекциями вдохновлений.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#000000",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn("antialiased", sans.variable, mono.variable, serif.variable, pixel.variable)}
    >
      <body>
        <Suspense fallback={<></>}>
          <ThemeProvider>
            <Toaster />
            <TooltipProvider>
              <NuqsAdapter>
                <QueryProvider>
                  <QueryTheme />
                  {children}
                </QueryProvider>
              </NuqsAdapter>
            </TooltipProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}
