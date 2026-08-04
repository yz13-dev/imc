import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: "./src",
  debug: true,
  manifest: {
    default_locale: "ru",

    name: "__MSG_extName__",
    short_name: "__MSG_extShortName__",

    version: "0.1.2",

    description: "__MSG_extDescription__",

    permissions: [
      "storage",
      "contextMenus",
    ],

    // "https://*/*" already covers the API host (prod and dev), needed anyway
    // to fetch/save images from any site the user visits.
    host_permissions: [
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
        "id": "imc@yz13.dev",
        // https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
        "data_collection_permissions": {
          // authenticationInfo: the token saved in browser.storage.local
          // websiteContent: the saved image/video plus the source page's
          // title, URL and favicon sent to the IMC API when saving
          "required": ["authenticationInfo", "websiteContent"],
          "optional": []
        }
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
