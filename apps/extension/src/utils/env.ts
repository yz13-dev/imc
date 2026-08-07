// Fallbacks are the public production URLs (not secret — already visible in
// the built bundle). This keeps a from-scratch rebuild (e.g. by an AMO
// reviewer building from the submitted sources without a local .env) working
// and identical to what we actually ship, without requiring a .env file.
export const API_URL = import.meta.env.WXT_API_URL || "https://api.imc.yz13.dev";
export const APP_URL = import.meta.env.WXT_APP_URL || "https://imc.yz13.dev";

export const USE_TEST = import.meta.env.WXT_USE_TEST || false;
