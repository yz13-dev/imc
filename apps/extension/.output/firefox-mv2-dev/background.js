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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi93eHRAMC4yMC4yNisyMjg3YTQ2NTJmYmI3ZTEyL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad3h0LWRlditicm93c2VyQDAuMS40My9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vd3h0QDAuMjAuMjYrMjI4N2E0NjUyZmJiN2UxMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvYXV0aC50cyIsIi4uLy4uL3NyYy91dGlscy9hdHRhY2htZW50cy50cyIsIi4uLy4uL3NyYy9lbnRyeXBvaW50cy9iYWNrZ3JvdW5kLnRzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vQHdlYmV4dC1jb3JlK21hdGNoLXBhdHRlcm5zQDEuMC4zL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvbGliL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvdXRpbHMvZGVmaW5lLWJhY2tncm91bmQudHNcbmZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG5cdGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuXHRyZXR1cm4gYXJnO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVCYWNrZ3JvdW5kIH07XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VG9rZW4oKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RvcmFnZSA9IGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQoWydpbWNfdG9rZW4nXSk7XG4gICAgY29uc3QgdG9rZW4gPSBzdG9yYWdlLmltY190b2tlbiBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoIXRva2VuKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB0b2tlbiBmb3VuZFwiKTtcbiAgICByZXR1cm4gdG9rZW47XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFVzZXIoKSB7XG4gIHRyeSB7XG5cbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKClcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2xvY2FsaG9zdDo4MDgwL2F1dGgvbWVcIiwge1xuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcbiAgICBjb25zdCBpc09rID0gc3RhdHVzID09PSAyMDA7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIHJldHVybiB7IGRhdGE6IGlzT2sgPyBkYXRhIDogbnVsbCwgc3RhdHVzLCBlcnJvcjogIWlzT2sgPyBkYXRhLm1lc3NhZ2UgOiBudWxsIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSwgc3RhdHVzOiA1MDAsIGRhdGE6IG51bGwgfTtcbiAgfVxufVxuIiwiXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hBdHRhY2htZW50cyh1cmw6IHN0cmluZykge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5ibG9iKCk7XG4gIHJldHVybiBkYXRhO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkQXR0YWNobWVudChmaWxlOiBCbG9iKSB7XG4gIHRyeSB7XG5cbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKClcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKClcblxuICAgIGZvcm1EYXRhLmFwcGVuZChcImZpbGVcIiwgZmlsZSlcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2xvY2FsaG9zdDo4MDgwL3YxL215L2F0dGFjaG1lbnRzL25ld1wiLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgYm9keTogZm9ybURhdGEsXG4gICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dG9rZW59YFxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG4iLCJpbXBvcnQgeyBmZXRjaEF0dGFjaG1lbnRzLCB1cGxvYWRBdHRhY2htZW50IH0gZnJvbSBcIkAvdXRpbHMvYXR0YWNobWVudHNcIjtcbmltcG9ydCB7IGdldFVzZXIgfSBmcm9tIFwiQC91dGlscy9hdXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoKCkgPT4ge1xuICBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoYXN5bmMgKCkgPT4ge1xuICAgIGJyb3dzZXJcbiAgICAgIC5jb250ZXh0TWVudXNcbiAgICAgIC5jcmVhdGUoe1xuICAgICAgICBpZDogXCJzYXZlLXRvLWltY1wiLFxuICAgICAgICB0aXRsZTogXCLQodC+0YXRgNCw0L3QuNGC0Ywg0LIgSU1DXCIsXG4gICAgICAgIGNvbnRleHRzOiBbXCJpbWFnZVwiLCBcInZpZGVvXCJdLFxuICAgICAgfSk7XG4gIH0pO1xuICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuXG4gICAgY29uc29sZS5sb2cobWVzc2FnZSlcbiAgICAvLyDQn9GA0L7QstC10YDRj9C10Lwg0YLQuNC/INGB0L7QvtCx0YnQtdC90LjRjywg0LrQvtGC0L7RgNC+0LUg0L/RgNC40YHQu9Cw0Lsg0L3QsNGIINC60L7QvdGC0LXQvdGCLdGB0LrRgNC40L/RglxuICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UudHlwZSA9PT0gXCJBVVRIX1NVQ0NFU1NcIiAmJiBtZXNzYWdlLnRva2VuKSB7XG5cbiAgICAgIC8vINCh0L7RhdGA0LDQvdGP0LXQvCDRgtC+0LrQtdC9INCy0L4g0LLQvdGD0YLRgNC10L3QvdGO0Y4g0LHQtdC30L7Qv9Cw0YHQvdGD0Y4g0L/QsNC80Y/RgtGMINGA0LDRgdGI0LjRgNC10L3QuNGPXG4gICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHsgaW1jX3Rva2VuOiBtZXNzYWdlLnRva2VuIH0sICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCLQo9GA0LAhINCi0L7QutC10L0g0YHQvtGF0YDQsNC90LXQvSDQstC90YPRgtGA0Lgg0YDQsNGB0YjQuNGA0LXQvdC40Y8uXCIpO1xuXG4gICAgICAgIC8vINCe0L/RhtC40L7QvdCw0LvRjNC90L46INC+0YLQv9GA0LDQstC70Y/QtdC8INC+0YLQstC10YIg0L3QsNC30LDQtCDQutC+0L3RgtC10L3Rgi3RgdC60YDQuNC/0YLRgywg0LXRgdC70Lgg0L3Rg9C20L3QvlxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlOyAvLyDQlNC10YDQttC40Lwg0LrQsNC90LDQuyDRgdCy0Y/Qt9C4INC+0YLQutGA0YvRgtGL0Lwg0LTQu9GPINCw0YHQuNC90YXRgNC+0L3QvdC+0LPQviDQvtGC0LLQtdGC0LBcbiAgICB9XG4gIH0pO1xuICBicm93c2VyLmNvbnRleHRNZW51cy5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoXG4gICAgYXN5bmMgKGluZm8sIHRhYikgPT4ge1xuICAgICAgaWYgKGluZm8ubWVudUl0ZW1JZCAhPT0gXCJzYXZlLXRvLWltY1wiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghdGFiKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGlzSW1hZ2VPclZpZGVvID0gaW5mby5tZWRpYVR5cGUgPT09IFwiaW1hZ2VcIiB8fCBpbmZvLm1lZGlhVHlwZSA9PT0gXCJ2aWRlb1wiO1xuICAgICAgaWYgKCFpc0ltYWdlT3JWaWRlbykgcmV0dXJuO1xuXG4gICAgICBjb25zdCB7IHN0YXR1cywgZGF0YTogdXNlciB9ID0gYXdhaXQgZ2V0VXNlcigpO1xuICAgICAgY29uc29sZS5sb2coXCJ1c2VyXCIsIHVzZXIpXG4gICAgICBpZiAoc3RhdHVzICE9PSAyMDAgfHwgIXVzZXIpIHtcbiAgICAgICAgYnJvd3Nlci50YWJzLmNyZWF0ZSh7XG4gICAgICAgICAgdXJsOiBcImh0dHA6Ly9sb2NhbGhvc3Q6NTE3My9hdXRoL3NpZ25pblwiLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzb3VyY2VUaXRsZSA9IHRhYj8udGl0bGVcblxuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh0YWIhLnVybCEpO1xuICAgICAgY29uc3Qgc291cmNlVXJsID0gdXJsLnRvU3RyaW5nKClcblxuICAgICAgbGV0IHNvdXJjZUZhdmljb24gPSB0YWI/LmZhdkljb25Vcmw/LnN0YXJ0c1dpdGgoXCJkYXRhOlwiKSA/IG51bGwgOiB0YWI/LmZhdkljb25Vcmw7XG4gICAgICBjb25zb2xlLmxvZyhcInNvdXJjZUZhdmljb25cIiwgc291cmNlRmF2aWNvbiwgdGFiLmlkKVxuICAgICAgaWYgKCFzb3VyY2VGYXZpY29uICYmIHRhYi5pZCkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQhLCB7XG4gICAgICAgICAgdHlwZTogXCJHRVRfU09VUkNFX0RBVEFcIixcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwicmVzcG9uc2VcIiwgcmVzcG9uc2UpO1xuICAgICAgICBzb3VyY2VGYXZpY29uID0gcmVzcG9uc2U/LmZhdmljb247XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZSA9IHtcbiAgICAgICAgdGl0bGU6IHNvdXJjZVRpdGxlLFxuICAgICAgICB1cmw6IHNvdXJjZVVybCxcbiAgICAgICAgZmF2aWNvbjogc291cmNlRmF2aWNvbixcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZW5hbWVBcnJheSA9IChpbmZvPy5zcmNVcmwgfHwgXCJcIik/LnNwbGl0KFwiL1wiKVxuICAgICAgY29uc3QgZmlsZW5hbWUgPSBmaWxlbmFtZUFycmF5Py5bZmlsZW5hbWVBcnJheS5sZW5ndGggLSAxXTtcblxuICAgICAgY29uc3QgYXR0YWNobWVudCA9IHtcbiAgICAgICAgc3JjOiBpbmZvPy5zcmNVcmwsXG4gICAgICAgIHRpdGxlOiBgJHtzb3VyY2VUaXRsZX0gLSAke2ZpbGVuYW1lfWAsXG4gICAgICAgIGZpbGVuYW1lLFxuICAgICAgfVxuXG4gICAgICBpZiAoaW5mby5zcmNVcmwpIHtcbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IGZldGNoQXR0YWNobWVudHMoaW5mby5zcmNVcmwpXG4gICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSBhd2FpdCB1cGxvYWRBdHRhY2htZW50KGJsb2IpXG4gICAgICAgIGNvbnNvbGUubG9nKFwiYXR0YWNobWVudFwiLCBhdHRhY2htZW50KVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhcImZhdmljb25cIiwgc291cmNlRmF2aWNvbilcbiAgICAgIGNvbnNvbGUubG9nKFwic291cmNlXCIsIHNvdXJjZSlcbiAgICAgIGNvbnNvbGUubG9nKGF0dGFjaG1lbnQpO1xuICAgIH0sXG4gICk7XG59KTtcbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDZdLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLGlCQUFpQixLQUFLO0VBQzlCLElBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxZQUFZLE9BQU8sRUFBRSxNQUFNLElBQUk7RUFDakUsT0FBTztDQUNSOzs7Ozs7Ozs7Ozs7Ozs7OztDRVlBLElBQU0sVURmaUIsV0FBVyxTQUFTLFNBQVMsS0FDaEQsV0FBVyxVQUNYLFdBQVc7OztDRUZmLGVBQUEsV0FBQTs7Ozs7Ozs7O0NBV0E7Q0FFQSxlQUFBLFVBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNCQTs7O0NDbkNBLGVBQUEsaUJBQUEsS0FBQTs7Q0FJQTtDQUVBLGVBQUEsaUJBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQTs7O0NDM0JBLElBQUEscUJBQUEsdUJBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVGQSxDQUFBOzs7Q0N6RkEsSUFBSSxnQkFBZ0IsTUFBTTtFQUN4QixZQUFZLGNBQWM7R0FDeEIsSUFBSSxpQkFBaUIsY0FBYztJQUNqQyxLQUFLLFlBQVk7SUFDakIsS0FBSyxrQkFBa0IsQ0FBQyxHQUFHLGNBQWMsU0FBUztJQUNsRCxLQUFLLGdCQUFnQjtJQUNyQixLQUFLLGdCQUFnQjtHQUN2QixPQUFPO0lBQ0wsTUFBTSxTQUFTLHVCQUF1QixLQUFLLFlBQVk7SUFDdkQs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