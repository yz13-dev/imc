var background = (function() {
	//#region ../../node_modules/.bun/wxt@0.20.26+2287a4652fbb7e12/node_modules/wxt/dist/utils/define-background.mjs
	function defineBackground(arg) {
		if (arg == null || typeof arg === "function") return { main: arg };
		return arg;
	}
	//#endregion
	//#region ../../node_modules/.bun/wxt@0.20.26+2287a4652fbb7e12/node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region src/utils/auth.ts
	async function getToken() {
		try {
			const token = (await browser.storage.local.get(["imc_token"])).imc_token;
			if (!token) throw new Error("No token found");
			return token;
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	async function getUser() {
		try {
			const token = await getToken();
			if (!token) throw new Error("No token found");
			const response = await fetch("https://localhost:8080/auth/me", {
				credentials: "include",
				headers: { "Authorization": `Bearer ${token}` }
			});
			const status = response.status;
			const isOk = status === 200;
			const data = await response.json();
			return {
				data: isOk ? data : null,
				status,
				error: !isOk ? data.message : null
			};
		} catch (error) {
			console.error(error);
			return {
				error: error instanceof Error ? error.message : String(error),
				status: 500,
				data: null
			};
		}
	}
	//#endregion
	//#region src/utils/source.ts
	async function checkSource({ url }) {
		const urlInstance = new URL(url);
		const domain = urlInstance.hostname;
		const slug = urlInstance.pathname;
		const token = await getToken();
		if (!token) return null;
		try {
			return (await fetch(`https://localhost:8080/v1/source/check?domain=${domain}&slug=${slug}`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json"
				}
			})).json();
		} catch (error) {
			console.log(error);
			return null;
		}
	}
	//#endregion
	//#region src/utils/images.ts
	function parseImageUrl(baseUrl) {
		try {
			let url = new URL(baseUrl);
			const domain = url.hostname;
			console.log("[ DOMAIN ]", domain);
			if (domain.endsWith("twimg.com")) url = cleanXcomUrl(url);
			return url.toString();
		} catch {
			return baseUrl;
		}
	}
	function cleanXcomUrl(url) {
		if (url.searchParams.has("name")) url.searchParams.delete("name");
		return url;
	}
	//#endregion
	//#region src/entrypoints/background.ts
	var background_default = defineBackground(() => {
		browser.runtime.onInstalled.addListener(async () => {
			browser.contextMenus.create({
				id: "save-to-imc",
				title: "Сохранить в IMC",
				contexts: ["image", "video"]
			});
		});
		browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			console.log("[ MESSAGE ]", message);
			if (message && message.type === "AUTH_SUCCESS" && message.token) {
				browser.storage.local.set({ imc_token: message.token }, () => {
					console.log("Ура! Токен сохранен внутри расширения.");
					sendResponse({ success: true });
				});
				return true;
			}
		});
		browser.contextMenus.onClicked.addListener(async (info, tab) => {
			if (info.menuItemId !== "save-to-imc") return;
			if (!tab) return;
			if (!(info.mediaType === "image" || info.mediaType === "video")) return;
			const url = new URL(tab.url);
			const { status, data: user } = await getUser();
			console.log("[ USER ]", user.username);
			if (status !== 200 || !user) {
				browser.tabs.create({ url: `http://localhost:5173/auth/signin?next=${url.toString()}` });
				return;
			}
			const sourceTitle = tab?.title;
			const sourceUrl = url.toString();
			let sourceFavicon = tab?.favIconUrl?.startsWith("data:") ? null : tab?.favIconUrl;
			console.log("[ FAVICON ]", sourceFavicon);
			if (!sourceFavicon && tab.id) {
				const response = await browser.tabs.sendMessage(tab.id, { type: "GET_SOURCE_DATA" });
				console.log("[ SOURCE-DATA ]", response);
				sourceFavicon = response?.favicon;
			}
			const filenameArray = new URL(info?.srcUrl || "").pathname?.split("/");
			const filename = filenameArray?.[filenameArray.length - 1];
			const attachment = {
				src: info?.srcUrl,
				title: `${sourceTitle} - ${filename}`,
				filename
			};
			if (info.srcUrl) {
				const checkedSource = await checkSource({ url: sourceUrl });
				console.log("[ SOURCE ]", sourceUrl);
				console.log("[ EXIST ]", checkedSource?.exist);
				const attachmentUrl = parseImageUrl(info.srcUrl);
				console.log("[ CLEARED-ATTACHMENT-URL ]", attachmentUrl);
				attachment.src = attachmentUrl;
			}
		});
	});
	//#endregion
	//#region ../../node_modules/.bun/@webext-core+match-patterns@1.0.3/node_modules/@webext-core/match-patterns/lib/index.js
	var _MatchPattern = class {
		constructor(matchPattern) {
			if (matchPattern === "<all_urls>") {
				this.isAllUrls = true;
				this.protocolMatches = [..._MatchPattern.PROTOCOLS];
				this.hostnameMatch = "*";
				this.pathnameMatch = "*";
			} else {
				const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
				if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
				const [_, protocol, hostname, pathname] = groups;
				validateProtocol(matchPattern, protocol);
				validateHostname(matchPattern, hostname);
				this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
				this.hostnameMatch = hostname;
				this.pathnameMatch = pathname;
			}
		}
		includes(url) {
			if (this.isAllUrls) return true;
			const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
			return !!this.protocolMatches.find((protocol) => {
				if (protocol === "http") return this.isHttpMatch(u);
				if (protocol === "https") return this.isHttpsMatch(u);
				if (protocol === "file") return this.isFileMatch(u);
				if (protocol === "ftp") return this.isFtpMatch(u);
				if (protocol === "urn") return this.isUrnMatch(u);
			});
		}
		isHttpMatch(url) {
			return url.protocol === "http:" && this.isHostPathMatch(url);
		}
		isHttpsMatch(url) {
			return url.protocol === "https:" && this.isHostPathMatch(url);
		}
		isHostPathMatch(url) {
			if (!this.hostnameMatch || !this.pathnameMatch) return false;
			const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))];
			const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
			return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
		}
		isFileMatch(url) {
			throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
		}
		isFtpMatch(url) {
			throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
		}
		isUrnMatch(url) {
			throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
		}
		convertPatternToRegex(pattern) {
			const starsReplaced = this.escapeForRegex(pattern).replace(/\\\*/g, ".*");
			return RegExp(`^${starsReplaced}$`);
		}
		escapeForRegex(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
	};
	var MatchPattern = _MatchPattern;
	MatchPattern.PROTOCOLS = [
		"http",
		"https",
		"file",
		"ftp",
		"urn"
	];
	var InvalidMatchPattern = class extends Error {
		constructor(matchPattern, reason) {
			super(`Invalid match pattern "${matchPattern}": ${reason}`);
		}
	};
	function validateProtocol(matchPattern, protocol) {
		if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`);
	}
	function validateHostname(matchPattern, hostname) {
		if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
		if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, `If using a wildcard (*), it must go at the start of the hostname`);
	}
	//#endregion
	//#region \0virtual:wxt-background-entrypoint?/home/yz13/CODE/PERSONAL/imc/apps/extension/src/entrypoints/background.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	var ws;
	/** Connect to the websocket and listen for messages. */
	function getDevServerWebSocket() {
		if (ws == null) {
			const serverUrl = "ws://localhost:3000";
			logger.debug("Connecting to dev server @", serverUrl);
			ws = new WebSocket(serverUrl, "vite-hmr");
			ws.addWxtEventListener = ws.addEventListener.bind(ws);
			ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
				type: "custom",
				event,
				payload
			}));
			ws.addEventListener("open", () => {
				logger.debug("Connected to dev server");
			});
			ws.addEventListener("close", () => {
				logger.debug("Disconnected from dev server");
			});
			ws.addEventListener("error", (event) => {
				logger.error("Failed to connect to dev server", event);
			});
			ws.addEventListener("message", (e) => {
				try {
					const message = JSON.parse(e.data);
					if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
				} catch (err) {
					logger.error("Failed to handle message", err);
				}
			});
		}
		return ws;
	}
	function reloadContentScript(payload) {
		if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2(payload);
		else reloadContentScriptMv3(payload);
	}
	async function reloadContentScriptMv3({ registration, contentScript }) {
		if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
		else await reloadManifestContentScriptMv3(contentScript);
	}
	async function reloadManifestContentScriptMv3(contentScript) {
		const id = `wxt:${contentScript.js[0]}`;
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const existing = registered.find((cs) => cs.id === id);
		if (existing) {
			logger.debug("Updating content script", existing);
			await browser.scripting.updateContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		} else {
			logger.debug("Registering new content script...");
			await browser.scripting.registerContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		}
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadRuntimeContentScriptMv3(contentScript) {
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const matches = registered.filter((cs) => {
			const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
			const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
			return hasJs || hasCss;
		});
		if (matches.length === 0) {
			logger.log("Content script is not registered yet, nothing to reload", contentScript);
			return;
		}
		await browser.scripting.updateContentScripts(matches);
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadTabsForContentScript(contentScript) {
		const allTabs = await browser.tabs.query({});
		const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
		const matchingTabs = allTabs.filter((tab) => {
			const url = tab.url;
			if (!url) return false;
			return !!matchPatterns.find((pattern) => pattern.includes(url));
		});
		await Promise.all(matchingTabs.map(async (tab) => {
			try {
				await browser.tabs.reload(tab.id);
			} catch (err) {
				logger.warn("Failed to reload tab:", err);
			}
		}));
	}
	async function reloadContentScriptMv2(_payload) {
		throw Error("TODO: reloadContentScriptMv2");
	}
	try {
		const ws = getDevServerWebSocket();
		ws.addWxtEventListener("wxt:reload-extension", () => {
			browser.runtime.reload();
		});
		ws.addWxtEventListener("wxt:reload-content-script", (event) => {
			reloadContentScript(event.detail);
		});
	} catch (err) {
		logger.error("Failed to setup web socket connection with dev server", err);
	}
	browser.commands.onCommand.addListener((command) => {
		if (command === "wxt:reload-extension") browser.runtime.reload();
	});
	var result;
	try {
		result = background_default.main();
		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
	} catch (err) {
		logger.error("The background crashed on startup!");
		throw err;
	}
	//#endregion
	return result;
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi93eHRAMC4yMC4yNisyMjg3YTQ2NTJmYmI3ZTEyL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad3h0LWRlditicm93c2VyQDAuMS40My9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vd3h0QDAuMjAuMjYrMjI4N2E0NjUyZmJiN2UxMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvYXV0aC50cyIsIi4uLy4uL3NyYy91dGlscy9zb3VyY2UudHMiLCIuLi8uLi9zcmMvdXRpbHMvaW1hZ2VzLnRzIiwiLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad2ViZXh0LWNvcmUrbWF0Y2gtcGF0dGVybnNAMS4wLjMvbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtYmFja2dyb3VuZC50c1xuZnVuY3Rpb24gZGVmaW5lQmFja2dyb3VuZChhcmcpIHtcblx0aWYgKGFyZyA9PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHsgbWFpbjogYXJnIH07XG5cdHJldHVybiBhcmc7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUJhY2tncm91bmQgfTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgYnJvd3NlciQxIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvYnJvd3Nlci50c1xuLyoqXG4qIENvbnRhaW5zIHRoZSBgYnJvd3NlcmAgZXhwb3J0IHdoaWNoIHlvdSBzaG91bGQgdXNlIHRvIGFjY2VzcyB0aGUgZXh0ZW5zaW9uXG4qIEFQSXMgaW4geW91ciBwcm9qZWN0OlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnd3h0L2Jyb3dzZXInO1xuKlxuKiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuKiAgIC8vIC4uLlxuKiB9KTtcbiogYGBgXG4qXG4qIEBtb2R1bGUgd3h0L2Jyb3dzZXJcbiovXG5jb25zdCBicm93c2VyID0gYnJvd3NlciQxO1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBicm93c2VyIH07XG4iLCJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUb2tlbigpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdG9yYWdlID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChbJ2ltY190b2tlbiddKTtcbiAgICBjb25zdCB0b2tlbiA9IHN0b3JhZ2UuaW1jX3Rva2VuIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIHJldHVybiB0b2tlbjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VXNlcigpIHtcbiAgdHJ5IHtcblxuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuXG4gICAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vbG9jYWxob3N0OjgwODAvYXV0aC9tZVwiLCB7XG4gICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dG9rZW59YFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xuICAgIGNvbnN0IGlzT2sgPSBzdGF0dXMgPT09IDIwMDtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIHsgZGF0YTogaXNPayA/IGRhdGEgOiBudWxsLCBzdGF0dXMsIGVycm9yOiAhaXNPayA/IGRhdGEubWVzc2FnZSA6IG51bGwgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLCBzdGF0dXM6IDUwMCwgZGF0YTogbnVsbCB9O1xuICB9XG59XG4iLCJcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U291cmNlRGF0YSgpIHtcbiAgY29uc3QgZmF2aWNvbiA9XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTGlua0VsZW1lbnQ+KFxuICAgICAgJ2xpbmtbcmVsfj1cImljb25cIl0sIGxpbmtbcmVsPVwic2hvcnRjdXQgaWNvblwiXScsXG4gICAgKT8uaHJlZiA/PyBudWxsO1xuICBjb25zb2xlLmxvZyhcImZhdmljb24tXCIsIGZhdmljb24pXG4gIHJldHVybiB7XG4gICAgZmF2aWNvblxuICB9O1xufVxuXG5cblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlU291cmNlKHsgdGl0bGUsIHVybCwgZmF2aWNvbiwgYXR0YWNobWVudF9pZCB9OiB7IHRpdGxlOiBzdHJpbmc7IHVybDogc3RyaW5nLCBmYXZpY29uPzogc3RyaW5nLCBhdHRhY2htZW50X2lkPzogc3RyaW5nIH0pIHtcbiAgY29uc3QgdXJsSW5zdGFuY2UgPSBuZXcgVVJMKHVybClcbiAgY29uc3QgZG9tYWluID0gdXJsSW5zdGFuY2UuaG9zdG5hbWU7XG4gIGNvbnN0IHNsdWcgPSB1cmxJbnN0YW5jZS5wYXRobmFtZTtcbiAgdHJ5IHtcbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKClcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vbG9jYWxob3N0OjgwODAvdjEvc291cmNlL25ld1wiLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBuYW1lOiB0aXRsZSwgZG9tYWluLCBzbHVnLCBmYXZpY29uX3VybDogZmF2aWNvbiwgYXR0YWNobWVudF9pZCB9KSxcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja1NvdXJjZSh7IHVybCB9OiB7IHVybDogc3RyaW5nIH0pOiBQcm9taXNlPHsgaWQ6IHN0cmluZywgZXhpc3Q6IGJvb2xlYW4gfSB8IG51bGw+IHtcblxuICBjb25zdCB1cmxJbnN0YW5jZSA9IG5ldyBVUkwodXJsKVxuICBjb25zdCBkb21haW4gPSB1cmxJbnN0YW5jZS5ob3N0bmFtZTtcbiAgY29uc3Qgc2x1ZyA9IHVybEluc3RhbmNlLnBhdGhuYW1lO1xuXG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuICBpZiAoIXRva2VuKSByZXR1cm4gbnVsbFxuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9zb3VyY2UvY2hlY2s/ZG9tYWluPSR7ZG9tYWlufSZzbHVnPSR7c2x1Z31gLCB7XG4gICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dG9rZW59YCxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuIiwiXG5cblxuLy8g0K3RgtCwINGE0YPQvdC60YbQuNGPINC90YPQttC90LAg0YfRgtC+0LHRiyDRh9C40YHRgtC40YLRjCDRgdGB0YvQu9C60Lgg0L7RgiDRhNC+0YDQvNCw0YLQuNGA0L7QstCw0L3QuNC5INC60LDRgNGC0LjQvdC+0LosINC/0L4g0YLQuNC/0LAgbmFtZT0zNjB4MzYwXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbWFnZVVybChiYXNlVXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIGxldCB1cmwgPSBuZXcgVVJMKGJhc2VVcmwpXG4gICAgY29uc3QgZG9tYWluID0gdXJsLmhvc3RuYW1lXG5cbiAgICBjb25zb2xlLmxvZyhcIlsgRE9NQUlOIF1cIiwgZG9tYWluKVxuXG4gICAgaWYgKGRvbWFpbi5lbmRzV2l0aChcInR3aW1nLmNvbVwiKSkge1xuICAgICAgdXJsID0gY2xlYW5YY29tVXJsKHVybClcbiAgICB9XG5cbiAgICByZXR1cm4gdXJsLnRvU3RyaW5nKClcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGJhc2VVcmxcbiAgfVxufVxuXG5mdW5jdGlvbiBjbGVhblhjb21VcmwodXJsOiBVUkwpOiBVUkwge1xuICBjb25zdCBoYXNOYW1lUGFyYW0gPSB1cmwuc2VhcmNoUGFyYW1zLmhhcyhcIm5hbWVcIilcbiAgaWYgKGhhc05hbWVQYXJhbSkge1xuICAgIHVybC5zZWFyY2hQYXJhbXMuZGVsZXRlKFwibmFtZVwiKVxuICB9XG4gIHJldHVybiB1cmxcbn1cbiIsImltcG9ydCB7IGdldFVzZXIgfSBmcm9tIFwiQC91dGlscy9hdXRoXCI7XG5pbXBvcnQgeyBwYXJzZUltYWdlVXJsIH0gZnJvbSBcIkAvdXRpbHMvaW1hZ2VzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoKCkgPT4ge1xuICBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoYXN5bmMgKCkgPT4ge1xuICAgIGJyb3dzZXJcbiAgICAgIC5jb250ZXh0TWVudXNcbiAgICAgIC5jcmVhdGUoe1xuICAgICAgICBpZDogXCJzYXZlLXRvLWltY1wiLFxuICAgICAgICB0aXRsZTogXCLQodC+0YXRgNCw0L3QuNGC0Ywg0LIgSU1DXCIsXG4gICAgICAgIGNvbnRleHRzOiBbXCJpbWFnZVwiLCBcInZpZGVvXCJdLFxuICAgICAgfSk7XG4gIH0pO1xuICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuXG4gICAgY29uc29sZS5sb2coXCJbIE1FU1NBR0UgXVwiLCBtZXNzYWdlKVxuICAgIC8vINCf0YDQvtCy0LXRgNGP0LXQvCDRgtC40L8g0YHQvtC+0LHRidC10L3QuNGPLCDQutC+0YLQvtGA0L7QtSDQv9GA0LjRgdC70LDQuyDQvdCw0Ygg0LrQvtC90YLQtdC90YIt0YHQutGA0LjQv9GCXG4gICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSBcIkFVVEhfU1VDQ0VTU1wiICYmIG1lc3NhZ2UudG9rZW4pIHtcblxuICAgICAgLy8g0KHQvtGF0YDQsNC90Y/QtdC8INGC0L7QutC10L0g0LLQviDQstC90YPRgtGA0LXQvdC90Y7RjiDQsdC10LfQvtC/0LDRgdC90YPRjiDQv9Cw0LzRj9GC0Ywg0YDQsNGB0YjQuNGA0LXQvdC40Y9cbiAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyBpbWNfdG9rZW46IG1lc3NhZ2UudG9rZW4gfSwgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcItCj0YDQsCEg0KLQvtC60LXQvSDRgdC+0YXRgNCw0L3QtdC9INCy0L3Rg9GC0YDQuCDRgNCw0YHRiNC40YDQtdC90LjRjy5cIik7XG5cbiAgICAgICAgLy8g0J7Qv9GG0LjQvtC90LDQu9GM0L3Qvjog0L7RgtC/0YDQsNCy0LvRj9C10Lwg0L7RgtCy0LXRgiDQvdCw0LfQsNC0INC60L7QvdGC0LXQvdGCLdGB0LrRgNC40L/RgtGDLCDQtdGB0LvQuCDQvdGD0LbQvdC+XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7IC8vINCU0LXRgNC20LjQvCDQutCw0L3QsNC7INGB0LLRj9C30Lgg0L7RgtC60YDRi9GC0YvQvCDQtNC70Y8g0LDRgdC40L3RhdGA0L7QvdC90L7Qs9C+INC+0YLQstC10YLQsFxuICAgIH1cbiAgfSk7XG4gIGJyb3dzZXIuY29udGV4dE1lbnVzLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcihcbiAgICBhc3luYyAoaW5mbywgdGFiKSA9PiB7XG4gICAgICBpZiAoaW5mby5tZW51SXRlbUlkICE9PSBcInNhdmUtdG8taW1jXCIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCF0YWIpIHJldHVybjtcblxuICAgICAgY29uc3QgaXNJbWFnZU9yVmlkZW8gPSBpbmZvLm1lZGlhVHlwZSA9PT0gXCJpbWFnZVwiIHx8IGluZm8ubWVkaWFUeXBlID09PSBcInZpZGVvXCI7XG4gICAgICBpZiAoIWlzSW1hZ2VPclZpZGVvKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwodGFiIS51cmwhKTtcbiAgICAgIGNvbnN0IHsgc3RhdHVzLCBkYXRhOiB1c2VyIH0gPSBhd2FpdCBnZXRVc2VyKCk7XG4gICAgICBjb25zb2xlLmxvZyhcIlsgVVNFUiBdXCIsIHVzZXIudXNlcm5hbWUpXG4gICAgICBpZiAoc3RhdHVzICE9PSAyMDAgfHwgIXVzZXIpIHtcbiAgICAgICAgYnJvd3Nlci50YWJzLmNyZWF0ZSh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo1MTczL2F1dGgvc2lnbmluP25leHQ9JHt1cmwudG9TdHJpbmcoKX1gLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzb3VyY2VUaXRsZSA9IHRhYj8udGl0bGVcblxuICAgICAgY29uc3Qgc291cmNlVXJsID0gdXJsLnRvU3RyaW5nKClcblxuICAgICAgbGV0IHNvdXJjZUZhdmljb24gPSB0YWI/LmZhdkljb25Vcmw/LnN0YXJ0c1dpdGgoXCJkYXRhOlwiKSA/IG51bGwgOiB0YWI/LmZhdkljb25Vcmw7XG4gICAgICBjb25zb2xlLmxvZyhcIlsgRkFWSUNPTiBdXCIsIHNvdXJjZUZhdmljb24pXG4gICAgICBpZiAoIXNvdXJjZUZhdmljb24gJiYgdGFiLmlkKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCEsIHtcbiAgICAgICAgICB0eXBlOiBcIkdFVF9TT1VSQ0VfREFUQVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJbIFNPVVJDRS1EQVRBIF1cIiwgcmVzcG9uc2UpO1xuICAgICAgICBzb3VyY2VGYXZpY29uID0gcmVzcG9uc2U/LmZhdmljb247XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZSA9IHtcbiAgICAgICAgdGl0bGU6IHNvdXJjZVRpdGxlLFxuICAgICAgICB1cmw6IHNvdXJjZVVybCxcbiAgICAgICAgZmF2aWNvbjogc291cmNlRmF2aWNvbixcbiAgICAgIH1cblxuXG4gICAgICBjb25zdCBmaWxlbmFtZUFycmF5ID0gKG5ldyBVUkwoaW5mbz8uc3JjVXJsIHx8IFwiXCIpLnBhdGhuYW1lKT8uc3BsaXQoXCIvXCIpXG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGZpbGVuYW1lQXJyYXk/LltmaWxlbmFtZUFycmF5Lmxlbmd0aCAtIDFdO1xuXG4gICAgICBjb25zdCBhdHRhY2htZW50ID0ge1xuICAgICAgICBzcmM6IGluZm8/LnNyY1VybCxcbiAgICAgICAgdGl0bGU6IGAke3NvdXJjZVRpdGxlfSAtICR7ZmlsZW5hbWV9YCxcbiAgICAgICAgZmlsZW5hbWUsXG4gICAgICB9XG5cbiAgICAgIGlmIChpbmZvLnNyY1VybCkge1xuXG4gICAgICAgIGNvbnN0IGNoZWNrZWRTb3VyY2UgPSBhd2FpdCBjaGVja1NvdXJjZSh7IHVybDogc291cmNlVXJsIH0pXG4gICAgICAgIGNvbnNvbGUubG9nKFwiWyBTT1VSQ0UgXVwiLCBzb3VyY2VVcmwpXG4gICAgICAgIGNvbnNvbGUubG9nKFwiWyBFWElTVCBdXCIsIGNoZWNrZWRTb3VyY2U/LmV4aXN0KVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNoZWNrZWRTb3VyY2VcIiwgY2hlY2tlZFNvdXJjZSwgc291cmNlVXJsKVxuXG4gICAgICAgIGNvbnN0IGF0dGFjaG1lbnRVcmwgPSBwYXJzZUltYWdlVXJsKGluZm8uc3JjVXJsKVxuICAgICAgICBjb25zb2xlLmxvZyhcIlsgQ0xFQVJFRC1BVFRBQ0hNRU5ULVVSTCBdXCIsIGF0dGFjaG1lbnRVcmwpXG4gICAgICAgIGF0dGFjaG1lbnQuc3JjID0gYXR0YWNobWVudFVybFxuXG4gICAgICAgIC8vIGNvbnN0IGJsb2IgPSBhd2FpdCBmZXRjaEF0dGFjaG1lbnRzKGluZm8uc3JjVXJsKVxuICAgICAgICAvLyBjb25zdCBhdHRhY2htZW50ID0gYXdhaXQgdXBsb2FkQXR0YWNobWVudChibG9iKVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImF0dGFjaG1lbnRcIiwgYXR0YWNobWVudClcblxuICAgICAgICAvLyBjb25zdCBpZCA9IGF0dGFjaG1lbnQuaWRcblxuICAgICAgICAvLyBpZiAoaWQpIHtcbiAgICAgICAgLy8gYXdhaXQgY3JlYXRlU291cmNlKHsgdGl0bGU6IHNvdXJjZVRpdGxlIHx8IHVybC5ob3N0bmFtZSwgdXJsOiBzb3VyY2VVcmwsIGZhdmljb246IHNvdXJjZUZhdmljb24gfHwgdW5kZWZpbmVkLCBhdHRhY2htZW50X2lkOiBpZCB9KVxuICAgICAgICAvLyB9XG4gICAgICB9XG5cblxuICAgICAgLy8gY29uc29sZS5sb2coXCJmYXZpY29uXCIsIHNvdXJjZUZhdmljb24pXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInNvdXJjZVwiLCBzb3VyY2UpXG4gICAgICAvLyBjb25zb2xlLmxvZyhhdHRhY2htZW50KTtcbiAgICB9LFxuICApO1xufSk7XG4iLCIvLyBzcmMvaW5kZXgudHNcbnZhciBfTWF0Y2hQYXR0ZXJuID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4pIHtcbiAgICBpZiAobWF0Y2hQYXR0ZXJuID09PSBcIjxhbGxfdXJscz5cIikge1xuICAgICAgdGhpcy5pc0FsbFVybHMgPSB0cnVlO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBbLi4uX01hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG4gICAgICBpZiAoZ3JvdXBzID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuICAgICAgY29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuICAgICAgdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcbiAgICAgIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG4gICAgICB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcbiAgICB9XG4gIH1cbiAgaW5jbHVkZXModXJsKSB7XG4gICAgaWYgKHRoaXMuaXNBbGxVcmxzKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuICAgIHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcbiAgICB9KTtcbiAgfVxuICBpc0h0dHBNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0h0dHBzTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RuYW1lTWF0Y2hSZWdleHMgPSBbXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLFxuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoLnJlcGxhY2UoL15cXCpcXC4vLCBcIlwiKSlcbiAgICBdO1xuICAgIGNvbnN0IHBhdGhuYW1lTWF0Y2hSZWdleCA9IHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCk7XG4gICAgcmV0dXJuICEhaG9zdG5hbWVNYXRjaFJlZ2V4cy5maW5kKChyZWdleCkgPT4gcmVnZXgudGVzdCh1cmwuaG9zdG5hbWUpKSAmJiBwYXRobmFtZU1hdGNoUmVnZXgudGVzdCh1cmwucGF0aG5hbWUpO1xuICB9XG4gIGlzRmlsZU1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmaWxlOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc0Z0cE1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzVXJuTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgY29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKTtcbiAgICBjb25zdCBzdGFyc1JlcGxhY2VkID0gZXNjYXBlZC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG4gICAgcmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG4gIH1cbiAgZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn07XG52YXIgTWF0Y2hQYXR0ZXJuID0gX01hdGNoUGF0dGVybjtcbk1hdGNoUGF0dGVybi5QUk9UT0NPTFMgPSBbXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJmaWxlXCIsIFwiZnRwXCIsIFwidXJuXCJdO1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuICB9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG4gIGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYEhvc3RuYW1lIGNhbm5vdCBpbmNsdWRlIGEgcG9ydGApO1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCIqXCIpICYmIGhvc3RuYW1lLmxlbmd0aCA+IDEgJiYgIWhvc3RuYW1lLnN0YXJ0c1dpdGgoXCIqLlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpIHtcbiAgcmV0dXJuO1xufVxuZXhwb3J0IHtcbiAgSW52YWxpZE1hdGNoUGF0dGVybixcbiAgTWF0Y2hQYXR0ZXJu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