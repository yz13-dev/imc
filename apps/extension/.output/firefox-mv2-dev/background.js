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
	async function createSource({ title, url, favicon }) {
		const urlInstance = new URL(url);
		const domain = urlInstance.hostname;
		const slug = urlInstance.pathname;
		try {
			const token = await getToken();
			if (!token) throw new Error("No token found");
			return (await fetch("https://localhost:8080/v1/source/new", {
				method: "POST",
				body: JSON.stringify({
					name: title,
					domain,
					slug,
					favicon_url: favicon
				}),
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
	//#region src/utils/attachments.ts
	async function fetchAttachments(url) {
		return await (await fetch(url)).blob();
	}
	async function uploadAttachment(file) {
		try {
			const token = await getToken();
			if (!token) throw new Error("No token found");
			const formData = new FormData();
			formData.append("file", file);
			return (await fetch("https://localhost:8080/v1/my/attachments/new", {
				method: "POST",
				body: formData,
				credentials: "include",
				headers: { "Authorization": `Bearer ${token}` }
			})).json();
		} catch (error) {
			console.error(error);
			return null;
		}
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
			console.log(message);
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
			console.log("user", user);
			if (status !== 200 || !user) {
				browser.tabs.create({ url: `http://localhost:5173/auth/signin?next=${url.toString()}` });
				return;
			}
			const sourceTitle = tab?.title;
			const sourceUrl = url.toString();
			let sourceFavicon = tab?.favIconUrl?.startsWith("data:") ? null : tab?.favIconUrl;
			console.log("sourceFavicon", sourceFavicon, tab.id);
			if (!sourceFavicon && tab.id) {
				const response = await browser.tabs.sendMessage(tab.id, { type: "GET_SOURCE_DATA" });
				console.log("response", response);
				sourceFavicon = response?.favicon;
			}
			const source = {
				title: sourceTitle,
				url: sourceUrl,
				favicon: sourceFavicon
			};
			await createSource({
				title: sourceTitle || url.hostname,
				url: sourceUrl,
				favicon: sourceFavicon || void 0
			});
			const filenameArray = (info?.srcUrl || "")?.split("/");
			const filename = filenameArray?.[filenameArray.length - 1];
			const attachment = {
				src: info?.srcUrl,
				title: `${sourceTitle} - ${filename}`,
				filename
			};
			if (info.srcUrl) {
				const attachment = await uploadAttachment(await fetchAttachments(info.srcUrl));
				console.log("attachment", attachment);
			}
			console.log("favicon", sourceFavicon);
			console.log("source", source);
			console.log(attachment);
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi93eHRAMC4yMC4yNisyMjg3YTQ2NTJmYmI3ZTEyL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad3h0LWRlditicm93c2VyQDAuMS40My9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vd3h0QDAuMjAuMjYrMjI4N2E0NjUyZmJiN2UxMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvYXV0aC50cyIsIi4uLy4uL3NyYy91dGlscy9zb3VyY2UudHMiLCIuLi8uLi9zcmMvdXRpbHMvYXR0YWNobWVudHMudHMiLCIuLi8uLi9zcmMvZW50cnlwb2ludHMvYmFja2dyb3VuZC50cyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy8uYnVuL0B3ZWJleHQtY29yZSttYXRjaC1wYXR0ZXJuc0AxLjAuMy9ub2RlX21vZHVsZXMvQHdlYmV4dC1jb3JlL21hdGNoLXBhdHRlcm5zL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyNyZWdpb24gc3JjL3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLnRzXG5mdW5jdGlvbiBkZWZpbmVCYWNrZ3JvdW5kKGFyZykge1xuXHRpZiAoYXJnID09IG51bGwgfHwgdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4geyBtYWluOiBhcmcgfTtcblx0cmV0dXJuIGFyZztcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQmFja2dyb3VuZCB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsIlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFRva2VuKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHN0b3JhZ2UgPSBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KFsnaW1jX3Rva2VuJ10pO1xuICAgIGNvbnN0IHRva2VuID0gc3RvcmFnZS5pbWNfdG9rZW4gYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG4gICAgcmV0dXJuIHRva2VuO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRVc2VyKCkge1xuICB0cnkge1xuXG4gICAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbigpXG5cbiAgICBpZiAoIXRva2VuKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB0b2tlbiBmb3VuZFwiKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC9hdXRoL21lXCIsIHtcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0dXMgPSByZXNwb25zZS5zdGF0dXM7XG4gICAgY29uc3QgaXNPayA9IHN0YXR1cyA9PT0gMjAwO1xuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4geyBkYXRhOiBpc09rID8gZGF0YSA6IG51bGwsIHN0YXR1cywgZXJyb3I6ICFpc09rID8gZGF0YS5tZXNzYWdlIDogbnVsbCB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIHJldHVybiB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksIHN0YXR1czogNTAwLCBkYXRhOiBudWxsIH07XG4gIH1cbn1cbiIsIlxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3VyY2VEYXRhKCkge1xuICBjb25zdCBmYXZpY29uID1cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxMaW5rRWxlbWVudD4oXG4gICAgICAnbGlua1tyZWx+PVwiaWNvblwiXSwgbGlua1tyZWw9XCJzaG9ydGN1dCBpY29uXCJdJyxcbiAgICApPy5ocmVmID8/IG51bGw7XG4gIGNvbnNvbGUubG9nKFwiZmF2aWNvbi1cIiwgZmF2aWNvbilcbiAgcmV0dXJuIHtcbiAgICBmYXZpY29uXG4gIH07XG59XG5cblxuXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVTb3VyY2UoeyB0aXRsZSwgdXJsLCBmYXZpY29uIH06IHsgdGl0bGU6IHN0cmluZzsgdXJsOiBzdHJpbmcsIGZhdmljb24/OiBzdHJpbmcgfSkge1xuICBjb25zdCB1cmxJbnN0YW5jZSA9IG5ldyBVUkwodXJsKVxuICBjb25zdCBkb21haW4gPSB1cmxJbnN0YW5jZS5ob3N0bmFtZTtcbiAgY29uc3Qgc2x1ZyA9IHVybEluc3RhbmNlLnBhdGhuYW1lO1xuICB0cnkge1xuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuXG4gICAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9zb3VyY2UvbmV3XCIsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG5hbWU6IHRpdGxlLCBkb21haW4sIHNsdWcsIGZhdmljb25fdXJsOiBmYXZpY29uIH0pLFxuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrU291cmNlKHsgdXJsIH06IHsgdXJsOiBzdHJpbmcgfSkge1xuXG4gIGNvbnN0IHVybEluc3RhbmNlID0gbmV3IFVSTCh1cmwpXG4gIGNvbnN0IGRvbWFpbiA9IHVybEluc3RhbmNlLmhvc3RuYW1lO1xuICBjb25zdCBzbHVnID0gdXJsSW5zdGFuY2UucGF0aG5hbWU7XG5cbiAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbigpXG4gIGlmICghdG9rZW4pIHJldHVybiBudWxsXG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGBodHRwczovL2xvY2FsaG9zdDo4MDgwL3YxL3NvdXJjZS9jaGVjaz9zb3VyY2U9JHtkb21haW59JnNsdWc9JHtzbHVnfWAsIHtcbiAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXNwb25zZS5qc29uKClcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG4iLCJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaEF0dGFjaG1lbnRzKHVybDogc3RyaW5nKSB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcbiAgcmV0dXJuIGRhdGE7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGxvYWRBdHRhY2htZW50KGZpbGU6IEJsb2IpIHtcbiAgdHJ5IHtcblxuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuXG4gICAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKVxuXG4gICAgZm9ybURhdGEuYXBwZW5kKFwiZmlsZVwiLCBmaWxlKVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vbG9jYWxob3N0OjgwODAvdjEvbXkvYXR0YWNobWVudHMvbmV3XCIsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBib2R5OiBmb3JtRGF0YSxcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cbiIsImltcG9ydCB7IGZldGNoQXR0YWNobWVudHMsIHVwbG9hZEF0dGFjaG1lbnQgfSBmcm9tIFwiQC91dGlscy9hdHRhY2htZW50c1wiO1xuaW1wb3J0IHsgZ2V0VXNlciB9IGZyb20gXCJAL3V0aWxzL2F1dGhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XG4gICAgYnJvd3NlclxuICAgICAgLmNvbnRleHRNZW51c1xuICAgICAgLmNyZWF0ZSh7XG4gICAgICAgIGlkOiBcInNhdmUtdG8taW1jXCIsXG4gICAgICAgIHRpdGxlOiBcItCh0L7RhdGA0LDQvdC40YLRjCDQsiBJTUNcIixcbiAgICAgICAgY29udGV4dHM6IFtcImltYWdlXCIsIFwidmlkZW9cIl0sXG4gICAgICB9KTtcbiAgfSk7XG4gIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG5cbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxuICAgIC8vINCf0YDQvtCy0LXRgNGP0LXQvCDRgtC40L8g0YHQvtC+0LHRidC10L3QuNGPLCDQutC+0YLQvtGA0L7QtSDQv9GA0LjRgdC70LDQuyDQvdCw0Ygg0LrQvtC90YLQtdC90YIt0YHQutGA0LjQv9GCXG4gICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSBcIkFVVEhfU1VDQ0VTU1wiICYmIG1lc3NhZ2UudG9rZW4pIHtcblxuICAgICAgLy8g0KHQvtGF0YDQsNC90Y/QtdC8INGC0L7QutC10L0g0LLQviDQstC90YPRgtGA0LXQvdC90Y7RjiDQsdC10LfQvtC/0LDRgdC90YPRjiDQv9Cw0LzRj9GC0Ywg0YDQsNGB0YjQuNGA0LXQvdC40Y9cbiAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyBpbWNfdG9rZW46IG1lc3NhZ2UudG9rZW4gfSwgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcItCj0YDQsCEg0KLQvtC60LXQvSDRgdC+0YXRgNCw0L3QtdC9INCy0L3Rg9GC0YDQuCDRgNCw0YHRiNC40YDQtdC90LjRjy5cIik7XG5cbiAgICAgICAgLy8g0J7Qv9GG0LjQvtC90LDQu9GM0L3Qvjog0L7RgtC/0YDQsNCy0LvRj9C10Lwg0L7RgtCy0LXRgiDQvdCw0LfQsNC0INC60L7QvdGC0LXQvdGCLdGB0LrRgNC40L/RgtGDLCDQtdGB0LvQuCDQvdGD0LbQvdC+XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7IC8vINCU0LXRgNC20LjQvCDQutCw0L3QsNC7INGB0LLRj9C30Lgg0L7RgtC60YDRi9GC0YvQvCDQtNC70Y8g0LDRgdC40L3RhdGA0L7QvdC90L7Qs9C+INC+0YLQstC10YLQsFxuICAgIH1cbiAgfSk7XG4gIGJyb3dzZXIuY29udGV4dE1lbnVzLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcihcbiAgICBhc3luYyAoaW5mbywgdGFiKSA9PiB7XG4gICAgICBpZiAoaW5mby5tZW51SXRlbUlkICE9PSBcInNhdmUtdG8taW1jXCIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCF0YWIpIHJldHVybjtcblxuICAgICAgY29uc3QgaXNJbWFnZU9yVmlkZW8gPSBpbmZvLm1lZGlhVHlwZSA9PT0gXCJpbWFnZVwiIHx8IGluZm8ubWVkaWFUeXBlID09PSBcInZpZGVvXCI7XG4gICAgICBpZiAoIWlzSW1hZ2VPclZpZGVvKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwodGFiIS51cmwhKTtcbiAgICAgIGNvbnN0IHsgc3RhdHVzLCBkYXRhOiB1c2VyIH0gPSBhd2FpdCBnZXRVc2VyKCk7XG4gICAgICBjb25zb2xlLmxvZyhcInVzZXJcIiwgdXNlcilcbiAgICAgIGlmIChzdGF0dXMgIT09IDIwMCB8fCAhdXNlcikge1xuICAgICAgICBicm93c2VyLnRhYnMuY3JlYXRlKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjUxNzMvYXV0aC9zaWduaW4/bmV4dD0ke3VybC50b1N0cmluZygpfWAsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZVRpdGxlID0gdGFiPy50aXRsZVxuXG4gICAgICBjb25zdCBzb3VyY2VVcmwgPSB1cmwudG9TdHJpbmcoKVxuXG4gICAgICBsZXQgc291cmNlRmF2aWNvbiA9IHRhYj8uZmF2SWNvblVybD8uc3RhcnRzV2l0aChcImRhdGE6XCIpID8gbnVsbCA6IHRhYj8uZmF2SWNvblVybDtcbiAgICAgIGNvbnNvbGUubG9nKFwic291cmNlRmF2aWNvblwiLCBzb3VyY2VGYXZpY29uLCB0YWIuaWQpXG4gICAgICBpZiAoIXNvdXJjZUZhdmljb24gJiYgdGFiLmlkKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCEsIHtcbiAgICAgICAgICB0eXBlOiBcIkdFVF9TT1VSQ0VfREFUQVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJyZXNwb25zZVwiLCByZXNwb25zZSk7XG4gICAgICAgIHNvdXJjZUZhdmljb24gPSByZXNwb25zZT8uZmF2aWNvbjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc291cmNlID0ge1xuICAgICAgICB0aXRsZTogc291cmNlVGl0bGUsXG4gICAgICAgIHVybDogc291cmNlVXJsLFxuICAgICAgICBmYXZpY29uOiBzb3VyY2VGYXZpY29uLFxuICAgICAgfVxuXG4gICAgICBhd2FpdCBjcmVhdGVTb3VyY2UoeyB0aXRsZTogc291cmNlVGl0bGUgfHwgdXJsLmhvc3RuYW1lLCB1cmw6IHNvdXJjZVVybCwgZmF2aWNvbjogc291cmNlRmF2aWNvbiB8fCB1bmRlZmluZWQgfSlcblxuICAgICAgY29uc3QgZmlsZW5hbWVBcnJheSA9IChpbmZvPy5zcmNVcmwgfHwgXCJcIik/LnNwbGl0KFwiL1wiKVxuICAgICAgY29uc3QgZmlsZW5hbWUgPSBmaWxlbmFtZUFycmF5Py5bZmlsZW5hbWVBcnJheS5sZW5ndGggLSAxXTtcblxuICAgICAgY29uc3QgYXR0YWNobWVudCA9IHtcbiAgICAgICAgc3JjOiBpbmZvPy5zcmNVcmwsXG4gICAgICAgIHRpdGxlOiBgJHtzb3VyY2VUaXRsZX0gLSAke2ZpbGVuYW1lfWAsXG4gICAgICAgIGZpbGVuYW1lLFxuICAgICAgfVxuXG4gICAgICBpZiAoaW5mby5zcmNVcmwpIHtcbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IGZldGNoQXR0YWNobWVudHMoaW5mby5zcmNVcmwpXG4gICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSBhd2FpdCB1cGxvYWRBdHRhY2htZW50KGJsb2IpXG4gICAgICAgIGNvbnNvbGUubG9nKFwiYXR0YWNobWVudFwiLCBhdHRhY2htZW50KVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhcImZhdmljb25cIiwgc291cmNlRmF2aWNvbilcbiAgICAgIGNvbnNvbGUubG9nKFwic291cmNlXCIsIHNvdXJjZSlcbiAgICAgIGNvbnNvbGUubG9nKGF0dGFjaG1lbnQpO1xuICAgIH0sXG4gICk7XG59KTtcbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDddLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLGlCQUFpQixLQUFLO0VBQzlCLElBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxZQUFZLE9BQU8sRUFBRSxNQUFNLElBQUk7RUFDakUsT0FBTztDQUNSOzs7Ozs7Ozs7Ozs7Ozs7OztDRVlBLElBQU0sVURmaUIsV0FBVyxTQUFTLFNBQVMsS0FDaEQsV0FBVyxVQUNYLFdBQVc7OztDRUZmLGVBQUEsV0FBQTs7Ozs7Ozs7O0NBV0E7Q0FFQSxlQUFBLFVBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNCQTs7O0NDbkJBLGVBQUEsYUFBQSxFQUFBLE9BQUEsS0FBQSxXQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUJBOzs7Q0N6Q0EsZUFBQSxpQkFBQSxLQUFBOztDQUlBO0NBRUEsZUFBQSxpQkFBQSxNQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0NBdUJBOzs7Q0MzQkEsSUFBQSxxQkFBQSx1QkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUZBLENBQUE7OztDQzNGQSxJQUFJLGdCQUFnQixNQUFNO0VBQ3hCLFlBQVksY0FBYztHQUN4QixJQUFJLGlC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