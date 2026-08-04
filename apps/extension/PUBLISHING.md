# Publishing to Chrome Web Store / Firefox AMO

## Privacy policy

URL: `https://imc.yz13.dev/privacy` (page at `apps/web/app/(root)/privacy/page.tsx`).

## Single purpose description

The extension lets users save images, gifs, and videos from any website to
their personal IMC account via a context menu item, keeping a link back to the
source page.

## Permission justifications (Chrome Web Store → Privacy practices)

**`storage`**
> Used to store the user's auth token locally in `browser.storage.local`, so
> they don't have to sign in again on every save.

**`contextMenus`**
> Used to add the "Save to IMC" item to the context menu on images and
> videos — this is the only way a save is triggered.

**`host_permissions: https://*/*`**
> Needed for two things: (1) downloading the actual image/video bytes from the
> domain the media is hosted on, which is often different from the page's own
> domain (e.g. a CDN on Twitter/X or Dribbble), and (2) sending the saved file
> to the extension's own API (`api.imc.yz13.dev`). The extension does not read
> or modify page content — access is only used at the moment the user
> explicitly triggers a save from the context menu.

**Content script (`<all_urls>`)**
> A lightweight script runs on all pages for two reasons: to return the
> current page's favicon on request at save time, and to receive the auth
> token from the IMC sign-in page after a successful login. It does not
> monitor page content and does not send any data without an explicit user
> action.

## Version notes (0.1.2)

Bug fix only, no new permissions and no behavior change visible to reviewers
beyond the fix itself:

> The "Save to IMC" context menu item could disappear after the browser was
> restarted. The extension only (re)created it inside `runtime.onInstalled`,
> which fires on install/update but not on every browser startup — and
> context menu items are not persisted by the browser across restarts.
> Fixed by creating the menu item unconditionally when the background
> script runs (`src/entrypoints/background.ts`), which covers install,
> browser startup, and (for Chrome's MV3 service worker) every wake-up.
> A duplicate-id error from a second `contextMenus.create` call in the same
> session is caught via the create callback and ignored — it just means the
> item already exists.

## Notes for reviewer (Firefox AMO)

`bun run zip:firefox` produces both `extension-<version>-firefox.zip` and
`extension-<version>-sources.zip` — the sources archive is required because
the shipped build is minified. It does not include `.env` (gitignored), but
that's fine: `src/utils/env.ts` falls back to the production URLs
(`https://api.imc.yz13.dev`, `https://imc.yz13.dev`) when the env vars aren't
set, so a plain `bun install && bun run build:firefox` from the submitted
sources reproduces the same build byte-for-byte, no setup needed.

## Remote code

The extension does not execute remote code — all JS is bundled and packaged
into the zip (`bun run zip` / `bun run zip:firefox`), no `eval` or dynamic
imports from external URLs.

## Data usage disclosure (form checkboxes)

- Personally identifiable information — yes (account email).
- Web history — no.
- User activity — no (only content the user explicitly chooses to save).
- Website content — yes (saved images/videos + source page metadata: title,
  URL, favicon).

Check: "I do not sell or transfer user data to third parties" and "I do not
use or transfer user data for purposes unrelated to the item's single
purpose".

## Data collection permissions (Firefox manifest)

Firefox requires `browser_specific_settings.gecko.data_collection_permissions`
in the manifest (see
https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).
Set in `wxt.config.ts`:

```json
"data_collection_permissions": {
  "required": ["authenticationInfo", "websiteContent"],
  "optional": []
}
```

- **`authenticationInfo`** — the auth token stored in `browser.storage.local`.
- **`websiteContent`** — the saved image/video file plus the source page's
  title, URL, and favicon sent to the IMC API when saving.

`personallyIdentifyingInfo` (account email) is not declared here — the
extension itself never reads or stores the email, only an opaque token; the
web app's own sign-in page handles the email/account identity.
