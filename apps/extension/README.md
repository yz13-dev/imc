# IMC Extension

Browser extension for [IMC](https://imc.yz13.dev) — save inspiration and references (images, gifs, and videos) right from the pages you're browsing, then sort them in the dashboard.

Built with [WXT](https://wxt.dev) + React, supports Chrome (MV3), Firefox, and Firefox for Android.

## How it works

The primary way to save is the **"Save to IMC"** context menu item on images, gifs, and videos — but that relies on the browser's native context menu, which isn't always available:

- **Firefox for Android** doesn't support the WebExtension `contextMenus` API at all (no right-click on mobile).
- **Any desktop browser**, on a site that calls `event.preventDefault()` in its own `contextmenu` handler — a common trick on design/portfolio sites specifically to make right-click-saving images harder. Since the extension's menu item renders as part of the same native menu, it's suppressed along with everything else.

For both cases, `src/utils/media-context-fallback.ts` listens for the DOM `contextmenu` event on `img`/`video` (long-press fires it too, with `pointerType: "touch"`) and checks whether the native menu is actually going to show. If not — touch input, or the page already called `preventDefault()` — it shows its own small in-page "Save to IMC" button instead. On a normal desktop right-click where nothing blocks it, it does nothing and lets the native menu (with our item) show as usual.

There's also a **popup fallback**: clicking the toolbar icon opens a picker listing every image/video found on the page — useful when neither of the above catches the media (e.g. a CSS `background-image` rather than a real `<img>`). See `src/entrypoints/popup`.

All three entry points funnel into `saveTabMedia` (`src/utils/save.ts`): if the user isn't signed in, the sign-in page opens (`WXT_APP_URL/auth/signin`), after which the page sends the token back to the extension via `postMessage`/CustomEvent (see `src/entrypoints/content.ts`). Once the token is stored, the extension downloads the file, uploads it to the IMC API, puts it in the inbox, and links it to the source (the page it was saved from) — creating the source if it doesn't exist yet.

> Note for Firefox desktop users on a right-click-blocking site: Shift+right-click always shows Firefox's native menu (including our item) without running the page's JS at all — a Firefox-only bypass unrelated to this extension.

## Structure

```
src/
  entrypoints/
    background.ts               # context menu (desktop), context-fallback message handler, auth handling
    content.ts                   # bridge between the page and background: token/source data exchange, context fallback, page media scan
    popup/                        # toolbar popup — fallback media picker for when nothing else catches the media
  utils/
    auth.ts                      # get token / current user
    attachments.ts                # download file and upload attachment to IMC
    images.ts                     # clean up image URLs (twimg, dribbble, etc.)
    source.ts                     # check/create source, get page favicon
    media.ts                      # scan the page for img/video elements (used by the popup)
    media-context-fallback.ts      # in-page "Save to IMC" button for Android long-press and blocked desktop context menus
    save.ts                        # shared save pipeline used by the context menu, the fallback, and the popup
```

## Environment variables

| Variable        | Purpose                                   |
| ---------------- | ------------------------------------------ |
| `WXT_API_URL`   | base URL of the IMC API                    |
| `WXT_APP_URL`   | base URL of the IMC web app (for sign-in redirects) |

`.env` holds production values, `.env.development` holds local ones (used by `dev`/`dev:firefox`). Both are gitignored; if neither is present, `src/utils/env.ts` falls back to the production URLs, so a fresh clone still builds a working extension without any setup.

## Development

```sh
bun install
bun run dev            # Chrome, dev mode
bun run dev:firefox    # Firefox, dev mode
```

## Build and package

```sh
bun run build           # production build for Chrome (MV3)
bun run build:firefox   # production build for Firefox
bun run zip             # build and package a .zip for the Chrome Web Store
bun run zip:firefox     # build and package a .zip for Firefox AMO
bun run compile         # type-check only (tsc --noEmit)
```

## Permissions

- `storage` — stores the auth token in `browser.storage.local`.
- `contextMenus` — the "Save to IMC" context menu item. Ignored at runtime on Firefox for Android, where the API doesn't exist — `background.ts` checks for it before use so the rest of the background script (message handling, context-fallback saves) still works there.
- `host_permissions: https://*/*` — needed to download images/videos from any site the user visits (media is often hosted on a CDN domain different from the page itself), and to talk to the IMC API. Because of this permission, the browser shows a "read and change data on all sites" warning — this needs to be justified in the extension's store listing (see `PUBLISHING.md`).

The manifest previously also had `cookies` and `tabs` — both were removed: `cookies` was unused (no `browser.cookies.*` calls anywhere), and `tabs` was redundant — `tabs.create`/`tabs.sendMessage` don't require it, and access to `tab.title`/`tab.favIconUrl` in the context menu handler is already covered by `host_permissions`.

## Android

`browser_specific_settings.gecko_android` in `wxt.config.ts` is what tells AMO to list the extension on Firefox for Android — without it (even empty), AMO treats the extension as desktop-only. See `extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/` for the full list of APIs that don't exist on Android (`contextMenus`, `commands`, `sidebarAction`, `bookmarks`, `history`, `sessions`, `windows`); this codebase currently only depends on `contextMenus` from that list, and works around it as described above.

## Localization

The manifest's `name`/`short_name`/`description`, the context menu item text,
and the popup/context-fallback UI strings are localized via standard WebExtension
i18n (`public/_locales/<lang>/messages.json`, `default_locale: "ru"` in
`wxt.config.ts`). Currently supports `ru` and `en`. To add a language, add
`public/_locales/<lang>/messages.json` with the same keys as the `en` file —
no code changes needed. New/changed message keys need a rebuild (`bun run
dev`/`build`, or `wxt prepare`) for `browser.i18n.getMessage` types to
regenerate.

## Publishing

See `PUBLISHING.md` for the privacy policy link and permission justification text for the Chrome Web Store / Firefox AMO listing forms.
