# Правила для этого репозитория

- Используй `bun` как менеджер пакетов и раннер скриптов (не `npm`/`npx`/`yarn`/`pnpm`).
- Коммиты: только короткий заголовок (`git commit -m "..."`), без тела/описания.
- Не добавляй `Co-Authored-By` в коммиты.

## Релиз extension

- При бампе версии расширения меняй её **в двух местах одновременно**:
  `apps/extension/package.json` и `apps/extension/wxt.config.ts` (`manifest.version`).
- После того как коммит с бампом версии запушен в `main`, создай и запушь
  тег `imc-v<version>` (например `imc-v0.1.3`) **на этом коммите в `main`**
  — это запускает `.github/workflows/extension-release.yml`, который
  собирает `chrome`/`firefox`/`sources` zip'ы и публикует их в GitHub
  Release. Воркфлоу сам проверяет, что тег совпадает с версией в
  `package.json` — иначе падает.
- Публикация в Chrome Web Store / Firefox AMO по-прежнему делается вручную
  через дашборды сторов — см. `apps/extension/PUBLISHING.md`.
