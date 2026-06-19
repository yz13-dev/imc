import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: "./src",
  debug: true,
  manifest: {
    name: "IMC",
    short_name: "IMC",

    version: "0.1.0",

    description: "Сохраняйте вдохновления и референсы в IMC",

    permissions: [
      "cookies",
      "storage",
      "tabs",
      "contextMenus",
    ],

    host_permissions: [
      "http://localhost:8080/*",
      "https://localhost:8080/*",
      "https://api.imc.your-domain.com/*",
      "https://*/*"
    ],

    action: {
      default_title: "IMC",
      theme_icons: [
        { dark: "/imc-dark.png", light: "/imc-light.png", size: 64 }
      ]
    },

    browser_specific_settings: {
      "gecko": {
        "id": "imc@yz13.dev"
      }
    },

    icons: {
      "16": "/imc-16-16.png",
      "32": "/imc-32-32.png",
      "48": "/imc-48-48.png",
      "128": "/imc-128-128.png",
    },
  },
});
