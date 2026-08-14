import QueryTheme from "@/components/query-theme";
import { ThemeProvider } from "@/components/theme-provider";
import { AUTH_SESSION_COOKIE } from "@/lib/auth";
import TokenBroadcaster from "@/lib/extension/token-broadcaster";
import QueryProvider from "@/providers/query";
import { Toaster } from "@workspace/ui/components/sonner";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import "@workspace/ui/globals.css";
import { mono, pixel, sans, serif } from "@workspace/ui/lib/fonts";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import "./view-transitions.css";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
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
                  <TokenBroadcaster token={token} />
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
