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
	async function getUser() {
		try {
			const token = (await browser.storage.local.get(["imc_token"])).imc_token;
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
			const { status, data: user } = await getUser();
			console.log("user", user);
			if (status !== 200 || !user) {
				browser.tabs.create({ url: "http://localhost:5173/auth/signin" });
				return;
			}
			const sourceTitle = tab?.title;
			const sourceUrl = new URL(tab.url).toString();
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
			const filenameArray = (info?.srcUrl || "")?.split("/");
			const filename = filenameArray?.[filenameArray.length - 1];
			const attachment = {
				src: info?.srcUrl,
				title: `${sourceTitle} - ${filename}`,
				filename
			};
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi93eHRAMC4yMC4yNisyMjg3YTQ2NTJmYmI3ZTEyL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad3h0LWRlditicm93c2VyQDAuMS40My9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vd3h0QDAuMjAuMjYrMjI4N2E0NjUyZmJiN2UxMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvYXV0aC50cyIsIi4uLy4uL3NyYy9lbnRyeXBvaW50cy9iYWNrZ3JvdW5kLnRzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vQHdlYmV4dC1jb3JlK21hdGNoLXBhdHRlcm5zQDEuMC4zL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvbGliL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvdXRpbHMvZGVmaW5lLWJhY2tncm91bmQudHNcbmZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG5cdGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuXHRyZXR1cm4gYXJnO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVCYWNrZ3JvdW5kIH07XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiXG5cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFVzZXIoKSB7XG4gIHRyeSB7XG5cbiAgICBjb25zdCBzdG9yYWdlID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChbJ2ltY190b2tlbiddKTtcbiAgICBjb25zdCB0b2tlbiA9IHN0b3JhZ2UuaW1jX3Rva2VuIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2xvY2FsaG9zdDo4MDgwL2F1dGgvbWVcIiwge1xuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcbiAgICBjb25zdCBpc09rID0gc3RhdHVzID09PSAyMDA7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIHJldHVybiB7IGRhdGE6IGlzT2sgPyBkYXRhIDogbnVsbCwgc3RhdHVzLCBlcnJvcjogIWlzT2sgPyBkYXRhLm1lc3NhZ2UgOiBudWxsIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSwgc3RhdHVzOiA1MDAsIGRhdGE6IG51bGwgfTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgZ2V0VXNlciB9IGZyb20gXCJAL3V0aWxzL2F1dGhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XG4gICAgYnJvd3NlclxuICAgICAgLmNvbnRleHRNZW51c1xuICAgICAgLmNyZWF0ZSh7XG4gICAgICAgIGlkOiBcInNhdmUtdG8taW1jXCIsXG4gICAgICAgIHRpdGxlOiBcItCh0L7RhdGA0LDQvdC40YLRjCDQsiBJTUNcIixcbiAgICAgICAgY29udGV4dHM6IFtcImltYWdlXCIsIFwidmlkZW9cIl0sXG4gICAgICB9KTtcbiAgfSk7XG4gIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG5cbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxuICAgIC8vINCf0YDQvtCy0LXRgNGP0LXQvCDRgtC40L8g0YHQvtC+0LHRidC10L3QuNGPLCDQutC+0YLQvtGA0L7QtSDQv9GA0LjRgdC70LDQuyDQvdCw0Ygg0LrQvtC90YLQtdC90YIt0YHQutGA0LjQv9GCXG4gICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSBcIkFVVEhfU1VDQ0VTU1wiICYmIG1lc3NhZ2UudG9rZW4pIHtcblxuICAgICAgLy8g0KHQvtGF0YDQsNC90Y/QtdC8INGC0L7QutC10L0g0LLQviDQstC90YPRgtGA0LXQvdC90Y7RjiDQsdC10LfQvtC/0LDRgdC90YPRjiDQv9Cw0LzRj9GC0Ywg0YDQsNGB0YjQuNGA0LXQvdC40Y9cbiAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyBpbWNfdG9rZW46IG1lc3NhZ2UudG9rZW4gfSwgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcItCj0YDQsCEg0KLQvtC60LXQvSDRgdC+0YXRgNCw0L3QtdC9INCy0L3Rg9GC0YDQuCDRgNCw0YHRiNC40YDQtdC90LjRjy5cIik7XG5cbiAgICAgICAgLy8g0J7Qv9GG0LjQvtC90LDQu9GM0L3Qvjog0L7RgtC/0YDQsNCy0LvRj9C10Lwg0L7RgtCy0LXRgiDQvdCw0LfQsNC0INC60L7QvdGC0LXQvdGCLdGB0LrRgNC40L/RgtGDLCDQtdGB0LvQuCDQvdGD0LbQvdC+XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7IC8vINCU0LXRgNC20LjQvCDQutCw0L3QsNC7INGB0LLRj9C30Lgg0L7RgtC60YDRi9GC0YvQvCDQtNC70Y8g0LDRgdC40L3RhdGA0L7QvdC90L7Qs9C+INC+0YLQstC10YLQsFxuICAgIH1cbiAgfSk7XG4gIGJyb3dzZXIuY29udGV4dE1lbnVzLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcihcbiAgICBhc3luYyAoaW5mbywgdGFiKSA9PiB7XG4gICAgICBpZiAoaW5mby5tZW51SXRlbUlkICE9PSBcInNhdmUtdG8taW1jXCIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCF0YWIpIHJldHVybjtcblxuICAgICAgY29uc3QgaXNJbWFnZU9yVmlkZW8gPSBpbmZvLm1lZGlhVHlwZSA9PT0gXCJpbWFnZVwiIHx8IGluZm8ubWVkaWFUeXBlID09PSBcInZpZGVvXCI7XG4gICAgICBpZiAoIWlzSW1hZ2VPclZpZGVvKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IHsgc3RhdHVzLCBkYXRhOiB1c2VyIH0gPSBhd2FpdCBnZXRVc2VyKCk7XG4gICAgICBjb25zb2xlLmxvZyhcInVzZXJcIiwgdXNlcilcbiAgICAgIGlmIChzdGF0dXMgIT09IDIwMCB8fCAhdXNlcikge1xuICAgICAgICBicm93c2VyLnRhYnMuY3JlYXRlKHtcbiAgICAgICAgICB1cmw6IFwiaHR0cDovL2xvY2FsaG9zdDo1MTczL2F1dGgvc2lnbmluXCIsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZVRpdGxlID0gdGFiPy50aXRsZVxuXG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHRhYiEudXJsISk7XG4gICAgICBjb25zdCBzb3VyY2VVcmwgPSB1cmwudG9TdHJpbmcoKVxuXG4gICAgICBsZXQgc291cmNlRmF2aWNvbiA9IHRhYj8uZmF2SWNvblVybD8uc3RhcnRzV2l0aChcImRhdGE6XCIpID8gbnVsbCA6IHRhYj8uZmF2SWNvblVybDtcbiAgICAgIGNvbnNvbGUubG9nKFwic291cmNlRmF2aWNvblwiLCBzb3VyY2VGYXZpY29uLCB0YWIuaWQpXG4gICAgICBpZiAoIXNvdXJjZUZhdmljb24gJiYgdGFiLmlkKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCEsIHtcbiAgICAgICAgICB0eXBlOiBcIkdFVF9TT1VSQ0VfREFUQVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJyZXNwb25zZVwiLCByZXNwb25zZSk7XG4gICAgICAgIHNvdXJjZUZhdmljb24gPSByZXNwb25zZT8uZmF2aWNvbjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc291cmNlID0ge1xuICAgICAgICB0aXRsZTogc291cmNlVGl0bGUsXG4gICAgICAgIHVybDogc291cmNlVXJsLFxuICAgICAgICBmYXZpY29uOiBzb3VyY2VGYXZpY29uLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlbmFtZUFycmF5ID0gKGluZm8/LnNyY1VybCB8fCBcIlwiKT8uc3BsaXQoXCIvXCIpXG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGZpbGVuYW1lQXJyYXk/LltmaWxlbmFtZUFycmF5Lmxlbmd0aCAtIDFdO1xuXG4gICAgICBjb25zdCBhdHRhY2htZW50ID0ge1xuICAgICAgICBzcmM6IGluZm8/LnNyY1VybCxcbiAgICAgICAgdGl0bGU6IGAke3NvdXJjZVRpdGxlfSAtICR7ZmlsZW5hbWV9YCxcbiAgICAgICAgZmlsZW5hbWUsXG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhcImZhdmljb25cIiwgc291cmNlRmF2aWNvbilcbiAgICAgIGNvbnNvbGUubG9nKFwic291cmNlXCIsIHNvdXJjZSlcbiAgICAgIGNvbnNvbGUubG9nKGF0dGFjaG1lbnQpO1xuICAgIH0sXG4gICk7XG59KTtcbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDVdLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLGlCQUFpQixLQUFLO0VBQzlCLElBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxZQUFZLE9BQU8sRUFBRSxNQUFNLElBQUk7RUFDakUsT0FB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