---
name: update-ui-kit
description: Pull the latest components from the yz13 ui-kit registry (https://ui.yz13.dev) into this repo, overwriting local copies with the upstream version. Use when asked to update, sync, refresh, or check for drift in ui-kit/shadcn components.
---

# Update ui-kit components

This repo installs components from the yz13 ui-kit registry (`https://ui.yz13.dev`) via `shadcn add`, which copies files directly into the repo rather than tracking them as a versioned dependency — there's no `npm update` for these. This skill re-pulls each already-installed component from the registry instead.

## Steps

1. Read `components.json` in the repo root. Use `aliases.ui` for the components directory (defaults to `components/ui` if the field is absent).
2. List every `.tsx` file directly in that directory — each file name without its extension is an installed component's registry name (e.g. `button.tsx` → `button`).
3. For each name, preview what would change without touching any files:
   ```
   bunx shadcn@latest add https://ui.yz13.dev/r/<name>.json --diff
   ```
   (Use `npx` instead of `bunx` if this repo isn't using bun — check for a `bun.lock`/`bun.lockb` first.)
4. Summarize which components have upstream changes before applying anything, so the user can see the scope up front.
5. For components with real changes, apply them:
   ```
   bunx shadcn@latest add https://ui.yz13.dev/r/<name>.json --overwrite --yes
   ```
6. Run `git diff --stat` and report what changed per file. If a file's diff mixes upstream changes with what looks like prior local customization (e.g. a class or prop that doesn't appear in the upstream version at all), call that out specifically — it just got overwritten, and the user may want to reapply it on top.
7. Don't commit automatically. Report the diff and ask whether to commit — follow this repo's own commit conventions if `CLAUDE.md` defines them.
