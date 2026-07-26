# IMC Extension

Browser extension for [IMC](https://imc.yz13.dev) — save inspiration and references (images, gifs, and videos) right from the pages you're browsing, then sort them in the dashboard.

Built with [WXT](https://wxt.dev) + React, supports Chrome (MV3) and Firefox.

## How it works

- A **"Save to IMC"** context menu item is added on images, gifs, and videos on any page.
- If the user isn't signed in, the sign-in page opens (`WXT_APP_URL/auth/signin`), after which the page sends the token back to the extension via `postMessage`/CustomEvent (see `src/entrypoints/content.ts`).
- Once the token is stored, the extension downloads the file, uploads it to the IMC API, puts it in the inbox, and links it to the source (the page it was saved from) — creating the source if it doesn't exist yet.

## Structure

```
src/
  entrypoints/
    background.ts   # context menu, auth handling, save pipeline
    content.ts       # bridge between the page and background: token and source data exchange
  utils/
    auth.ts          # get token / current user
    attachments.ts    # download file and upload attachment to IMC
    images.ts         # clean up image URLs (twimg, dribbble, etc.)
    source.ts         # check/create source, get page favicon
```

## Environment variables

| Variable        | Purpose                                   |
| ---------------- | ------------------------------------------ |
| `WXT_API_URL`   | base URL of the IMC API                    |
| `WXT_APP_URL`   | base URL of the IMC web app (for sign-in redirects) |

`.env` holds production values, `.env.development` holds local ones (used by `dev`/`dev:firefox`).

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
- `contextMenus` — the "Save to IMC" context menu item.
- `host_permissions: https://*/*` — needed to download images/videos from any site the user visits (media is often hosted on a CDN domain different from the page itself), and to talk to the IMC API. Because of this permission, the browser shows a "read and change data on all sites" warning — this needs to be justified in the extension's store listing (see `PUBLISHING.md`).

The manifest previously also had `cookies` and `tabs` — both were removed: `cookies` was unused (no `browser.cookies.*` calls anywhere), and `tabs` was redundant — `tabs.create`/`tabs.sendMessage` don't require it, and access to `tab.title`/`tab.favIconUrl` in the context menu handler is already covered by `host_permissions`.

## Publishing

See `PUBLISHING.md` for the privacy policy link and permission justification text for the Chrome Web Store / Firefox AMO listing forms.
