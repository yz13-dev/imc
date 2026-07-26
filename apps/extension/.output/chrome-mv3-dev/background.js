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
	//#region src/utils/env.ts
	var API_URL = "https://localhost:8080";
	var APP_URL = "http://localhost:5173";
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
			const response = await fetch(`${API_URL}/auth/me`, {
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
	async function createSource({ title, url, favicon, attachment_id }) {
		const urlInstance = new URL(url);
		const domain = urlInstance.hostname;
		const slug = urlInstance.pathname;
		try {
			const token = await getToken();
			if (!token) throw new Error("No token found");
			return (await fetch(`${API_URL}/v1/source/new`, {
				method: "POST",
				body: JSON.stringify({
					name: title,
					domain,
					slug,
					favicon_url: favicon,
					attachment_id
				}),
				credentials: "include",
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json"
				}
			})).json();
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	async function checkSource({ url }) {
		const urlInstance = new URL(url);
		const domain = urlInstance.hostname;
		const slug = urlInstance.pathname;
		const token = await getToken();
		if (!token) return null;
		try {
			return (await fetch(`${API_URL}/v1/source/check?domain=${domain}&slug=${slug}`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json"
				}
			})).json();
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	async function connectSource({ sourceID, attachmentID }) {
		const token = await getToken();
		if (!token) return null;
		try {
			return (await fetch(`${API_URL}/v1/source/${sourceID}/connect?attachmentID=${attachmentID}`, {
				method: "POST",
				credentials: "include",
				headers: { "Authorization": `Bearer ${token}` }
			})).json();
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	//#endregion
	//#region src/utils/attachments.ts
	async function fetchAttachments(url) {
		try {
			return await (await fetch(url)).blob();
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	async function uploadAttachment(file) {
		try {
			const token = await getToken();
			if (!token) throw new Error("No token found");
			const formData = new FormData();
			formData.append("file", file);
			return (await fetch(`${API_URL}/v1/my/attachments/new`, {
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
	async function inboxAttachment(id) {
		const token = await getToken();
		if (!token) throw new Error("No token found");
		return { status: (await fetch(`${API_URL}/v1/my/attachments/inbox?attachmentID=${id}`, {
			method: "POST",
			credentials: "include",
			headers: { "Authorization": `Bearer ${token}` }
		})).status };
	}
	//#endregion
	//#region src/utils/images.ts
	function parseImageUrl(baseUrl) {
		try {
			let url = new URL(baseUrl);
			const domain = url.hostname;
			if (domain.endsWith("twimg.com")) url = cleanXcomUrl(url);
			if (domain.endsWith("dribbble.com")) url = cleanDribbbleUrl(url);
			return url.toString();
		} catch {
			return baseUrl;
		}
	}
	function cleanXcomUrl(url) {
		if (url.searchParams.has("name")) url.searchParams.delete("name");
		return url;
	}
	function cleanDribbbleUrl(url) {
		if (url.searchParams.has("resize")) url.searchParams.delete("resize");
		return url;
	}
	//#endregion
	//#region src/entrypoints/background.ts
	var background_default = defineBackground(() => {
		browser.runtime.onInstalled.addListener(async () => {
			browser.contextMenus.create({
				id: "save-to-imc",
				title: browser.i18n.getMessage("contextMenuSave"),
				contexts: ["image", "video"]
			});
		});
		browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			if (message && message.type === "AUTH_SUCCESS" && message.token) {
				browser.storage.local.set({ imc_token: message.token }, () => {
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
			if (status !== 200 || !user) {
				browser.tabs.create({ url: `${APP_URL}/auth/signin?next=${url.toString()}` });
				return;
			}
			const sourceTitle = tab?.title;
			const sourceUrl = url.toString();
			let sourceFavicon = tab?.favIconUrl?.startsWith("data:") ? null : tab?.favIconUrl;
			if (!sourceFavicon && tab.id) sourceFavicon = (await browser.tabs.sendMessage(tab.id, { type: "GET_SOURCE_DATA" }))?.favicon;
			if (info.srcUrl) {
				const checkedSource = await checkSource({ url: sourceUrl });
				const attachmentUrl = parseImageUrl(info.srcUrl);
				const blob = await fetchAttachments(attachmentUrl);
				if (!blob) {
					console.error("[ ATTACHMENT-FETCH-FAILED ]", attachmentUrl);
					return;
				}
				const attachment = await uploadAttachment(blob);
				if (!attachment) {
					console.error("[ ATTACHMENT-UPLOAD-FAILED ]", attachmentUrl);
					return;
				}
				const id = attachment.id;
				if (id) {
					await inboxAttachment(id);
					if (checkedSource?.exist === true) await connectSource({
						sourceID: checkedSource.id,
						attachmentID: id
					});
					else {
						const source = await createSource({
							title: sourceTitle || url.hostname,
							url: attachmentUrl,
							favicon: sourceFavicon || void 0,
							attachment_id: id
						});
						if (source) await connectSource({
							sourceID: source.id,
							attachmentID: id
						});
					}
				}
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
	/** https://developer.chrome.com/blog/longer-esw-lifetimes/ */
	function keepServiceWorkerAlive() {
		setInterval(async () => {
			await browser.runtime.getPlatformInfo();
		}, 5e3);
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
		ws.addEventListener("open", () => ws.sendCustom("wxt:background-initialized"));
		keepServiceWorkerAlive();
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi93eHRAMC4yMC4yNisyMjg3YTQ2NTJmYmI3ZTEyL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad3h0LWRlditicm93c2VyQDAuMS40My9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vd3h0QDAuMjAuMjYrMjI4N2E0NjUyZmJiN2UxMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvZW52LnRzIiwiLi4vLi4vc3JjL3V0aWxzL2F1dGgudHMiLCIuLi8uLi9zcmMvdXRpbHMvc291cmNlLnRzIiwiLi4vLi4vc3JjL3V0aWxzL2F0dGFjaG1lbnRzLnRzIiwiLi4vLi4vc3JjL3V0aWxzL2ltYWdlcy50cyIsIi4uLy4uL3NyYy9lbnRyeXBvaW50cy9iYWNrZ3JvdW5kLnRzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vQHdlYmV4dC1jb3JlK21hdGNoLXBhdHRlcm5zQDEuMC4zL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvbGliL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvdXRpbHMvZGVmaW5lLWJhY2tncm91bmQudHNcbmZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG5cdGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuXHRyZXR1cm4gYXJnO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVCYWNrZ3JvdW5kIH07XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiLy8gRmFsbGJhY2tzIGFyZSB0aGUgcHVibGljIHByb2R1Y3Rpb24gVVJMcyAobm90IHNlY3JldCDigJQgYWxyZWFkeSB2aXNpYmxlIGluXG4vLyB0aGUgYnVpbHQgYnVuZGxlKS4gVGhpcyBrZWVwcyBhIGZyb20tc2NyYXRjaCByZWJ1aWxkIChlLmcuIGJ5IGFuIEFNT1xuLy8gcmV2aWV3ZXIgYnVpbGRpbmcgZnJvbSB0aGUgc3VibWl0dGVkIHNvdXJjZXMgd2l0aG91dCBhIGxvY2FsIC5lbnYpIHdvcmtpbmdcbi8vIGFuZCBpZGVudGljYWwgdG8gd2hhdCB3ZSBhY3R1YWxseSBzaGlwLCB3aXRob3V0IHJlcXVpcmluZyBhIC5lbnYgZmlsZS5cbmV4cG9ydCBjb25zdCBBUElfVVJMID0gaW1wb3J0Lm1ldGEuZW52LldYVF9BUElfVVJMIHx8IFwiaHR0cHM6Ly9hcGkuaW1jLnl6MTMuZGV2XCI7XG5leHBvcnQgY29uc3QgQVBQX1VSTCA9IGltcG9ydC5tZXRhLmVudi5XWFRfQVBQX1VSTCB8fCBcImh0dHBzOi8vaW1jLnl6MTMuZGV2XCI7XG4iLCJpbXBvcnQgeyBBUElfVVJMIH0gZnJvbSBcIkAvdXRpbHMvZW52XCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUb2tlbigpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdG9yYWdlID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChbJ2ltY190b2tlbiddKTtcbiAgICBjb25zdCB0b2tlbiA9IHN0b3JhZ2UuaW1jX3Rva2VuIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIHJldHVybiB0b2tlbjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VXNlcigpIHtcbiAgdHJ5IHtcblxuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuXG4gICAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtBUElfVVJMfS9hdXRoL21lYCwge1xuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcbiAgICBjb25zdCBpc09rID0gc3RhdHVzID09PSAyMDA7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIHJldHVybiB7IGRhdGE6IGlzT2sgPyBkYXRhIDogbnVsbCwgc3RhdHVzLCBlcnJvcjogIWlzT2sgPyBkYXRhLm1lc3NhZ2UgOiBudWxsIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSwgc3RhdHVzOiA1MDAsIGRhdGE6IG51bGwgfTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQVBJX1VSTCB9IGZyb20gXCJAL3V0aWxzL2VudlwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U291cmNlRGF0YSgpIHtcbiAgY29uc3QgZmF2aWNvbiA9XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTGlua0VsZW1lbnQ+KFxuICAgICAgJ2xpbmtbcmVsfj1cImljb25cIl0sIGxpbmtbcmVsPVwic2hvcnRjdXQgaWNvblwiXScsXG4gICAgKT8uaHJlZiA/PyBudWxsO1xuICByZXR1cm4ge1xuICAgIGZhdmljb25cbiAgfTtcbn1cblxuXG5cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVNvdXJjZSh7IHRpdGxlLCB1cmwsIGZhdmljb24sIGF0dGFjaG1lbnRfaWQgfTogeyB0aXRsZTogc3RyaW5nOyB1cmw6IHN0cmluZywgZmF2aWNvbj86IHN0cmluZywgYXR0YWNobWVudF9pZD86IHN0cmluZyB9KSB7XG4gIGNvbnN0IHVybEluc3RhbmNlID0gbmV3IFVSTCh1cmwpXG4gIGNvbnN0IGRvbWFpbiA9IHVybEluc3RhbmNlLmhvc3RuYW1lO1xuICBjb25zdCBzbHVnID0gdXJsSW5zdGFuY2UucGF0aG5hbWU7XG4gIHRyeSB7XG4gICAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbigpXG5cbiAgICBpZiAoIXRva2VuKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB0b2tlbiBmb3VuZFwiKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7QVBJX1VSTH0vdjEvc291cmNlL25ld2AsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG5hbWU6IHRpdGxlLCBkb21haW4sIHNsdWcsIGZhdmljb25fdXJsOiBmYXZpY29uLCBhdHRhY2htZW50X2lkIH0pLFxuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tTb3VyY2UoeyB1cmwgfTogeyB1cmw6IHN0cmluZyB9KTogUHJvbWlzZTx7IGlkOiBzdHJpbmcsIGV4aXN0OiBib29sZWFuIH0gfCBudWxsPiB7XG5cbiAgY29uc3QgdXJsSW5zdGFuY2UgPSBuZXcgVVJMKHVybClcbiAgY29uc3QgZG9tYWluID0gdXJsSW5zdGFuY2UuaG9zdG5hbWU7XG4gIGNvbnN0IHNsdWcgPSB1cmxJbnN0YW5jZS5wYXRobmFtZTtcblxuICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKClcbiAgaWYgKCF0b2tlbikgcmV0dXJuIG51bGxcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7QVBJX1VSTH0vdjEvc291cmNlL2NoZWNrP2RvbWFpbj0ke2RvbWFpbn0mc2x1Zz0ke3NsdWd9YCwge1xuICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29ubmVjdFNvdXJjZSh7IHNvdXJjZUlELCBhdHRhY2htZW50SUQgfTogeyBzb3VyY2VJRDogc3RyaW5nOyBhdHRhY2htZW50SUQ6IHN0cmluZyB9KSB7XG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuICBpZiAoIXRva2VuKSByZXR1cm4gbnVsbFxuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtBUElfVVJMfS92MS9zb3VyY2UvJHtzb3VyY2VJRH0vY29ubmVjdD9hdHRhY2htZW50SUQ9JHthdHRhY2htZW50SUR9YCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuIiwiaW1wb3J0IHsgQVBJX1VSTCB9IGZyb20gXCJAL3V0aWxzL2VudlwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hBdHRhY2htZW50cyh1cmw6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICAgIHJldHVybiBkYXRhO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkQXR0YWNobWVudChmaWxlOiBCbG9iKSB7XG4gIHRyeSB7XG5cbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKClcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKClcblxuICAgIGZvcm1EYXRhLmFwcGVuZChcImZpbGVcIiwgZmlsZSlcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7QVBJX1VSTH0vdjEvbXkvYXR0YWNobWVudHMvbmV3YCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5ib3hBdHRhY2htZW50KGlkOiBzdHJpbmcpIHtcbiAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbigpXG5cbiAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtBUElfVVJMfS92MS9teS9hdHRhY2htZW50cy9pbmJveD9hdHRhY2htZW50SUQ9JHtpZH1gLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gXG4gICAgfVxuICB9KTtcbiAgY29uc3Qgc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xuICByZXR1cm4geyBzdGF0dXMgfTtcbn1cbiIsIlxuXG5cbi8vINCt0YLQsCDRhNGD0L3QutGG0LjRjyDQvdGD0LbQvdCwINGH0YLQvtCx0Ysg0YfQuNGB0YLQuNGC0Ywg0YHRgdGL0LvQutC4INC+0YIg0YTQvtGA0LzQsNGC0LjRgNC+0LLQsNC90LjQuSDQutCw0YDRgtC40L3QvtC6LCDQv9C+INGC0LjQv9CwIG5hbWU9MzYweDM2MFxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW1hZ2VVcmwoYmFzZVVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBsZXQgdXJsID0gbmV3IFVSTChiYXNlVXJsKVxuICAgIGNvbnN0IGRvbWFpbiA9IHVybC5ob3N0bmFtZVxuXG4gICAgaWYgKGRvbWFpbi5lbmRzV2l0aChcInR3aW1nLmNvbVwiKSkge1xuICAgICAgdXJsID0gY2xlYW5YY29tVXJsKHVybClcbiAgICB9XG4gICAgaWYgKGRvbWFpbi5lbmRzV2l0aChcImRyaWJiYmxlLmNvbVwiKSkge1xuICAgICAgdXJsID0gY2xlYW5EcmliYmJsZVVybCh1cmwpXG4gICAgfVxuXG4gICAgcmV0dXJuIHVybC50b1N0cmluZygpXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBiYXNlVXJsXG4gIH1cbn1cblxuZnVuY3Rpb24gY2xlYW5YY29tVXJsKHVybDogVVJMKTogVVJMIHtcbiAgY29uc3QgaGFzTmFtZVBhcmFtID0gdXJsLnNlYXJjaFBhcmFtcy5oYXMoXCJuYW1lXCIpXG4gIGlmIChoYXNOYW1lUGFyYW0pIHtcbiAgICB1cmwuc2VhcmNoUGFyYW1zLmRlbGV0ZShcIm5hbWVcIilcbiAgfVxuICByZXR1cm4gdXJsXG59XG5cbmZ1bmN0aW9uIGNsZWFuRHJpYmJibGVVcmwodXJsOiBVUkwpOiBVUkwge1xuICBjb25zdCBoYXNOYW1lUGFyYW0gPSB1cmwuc2VhcmNoUGFyYW1zLmhhcyhcInJlc2l6ZVwiKVxuICBpZiAoaGFzTmFtZVBhcmFtKSB7XG4gICAgdXJsLnNlYXJjaFBhcmFtcy5kZWxldGUoXCJyZXNpemVcIilcbiAgfVxuICByZXR1cm4gdXJsXG59XG4iLCJpbXBvcnQgeyBnZXRVc2VyIH0gZnJvbSBcIkAvdXRpbHMvYXV0aFwiO1xuaW1wb3J0IHsgQVBQX1VSTCB9IGZyb20gXCJAL3V0aWxzL2VudlwiO1xuaW1wb3J0IHsgcGFyc2VJbWFnZVVybCB9IGZyb20gXCJAL3V0aWxzL2ltYWdlc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVCYWNrZ3JvdW5kKCgpID0+IHtcbiAgYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGFzeW5jICgpID0+IHtcbiAgICBicm93c2VyXG4gICAgICAuY29udGV4dE1lbnVzXG4gICAgICAuY3JlYXRlKHtcbiAgICAgICAgaWQ6IFwic2F2ZS10by1pbWNcIixcbiAgICAgICAgdGl0bGU6IGJyb3dzZXIuaTE4bi5nZXRNZXNzYWdlKFwiY29udGV4dE1lbnVTYXZlXCIpLFxuICAgICAgICBjb250ZXh0czogW1wiaW1hZ2VcIiwgXCJ2aWRlb1wiXSxcbiAgICAgIH0pO1xuICB9KTtcbiAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcblxuICAgIC8vINCf0YDQvtCy0LXRgNGP0LXQvCDRgtC40L8g0YHQvtC+0LHRidC10L3QuNGPLCDQutC+0YLQvtGA0L7QtSDQv9GA0LjRgdC70LDQuyDQvdCw0Ygg0LrQvtC90YLQtdC90YIt0YHQutGA0LjQv9GCXG4gICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSBcIkFVVEhfU1VDQ0VTU1wiICYmIG1lc3NhZ2UudG9rZW4pIHtcblxuICAgICAgLy8g0KHQvtGF0YDQsNC90Y/QtdC8INGC0L7QutC10L0g0LLQviDQstC90YPRgtGA0LXQvdC90Y7RjiDQsdC10LfQvtC/0LDRgdC90YPRjiDQv9Cw0LzRj9GC0Ywg0YDQsNGB0YjQuNGA0LXQvdC40Y9cbiAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyBpbWNfdG9rZW46IG1lc3NhZ2UudG9rZW4gfSwgKCkgPT4ge1xuICAgICAgICAvLyDQntC/0YbQuNC+0L3QsNC70YzQvdC+OiDQvtGC0L/RgNCw0LLQu9GP0LXQvCDQvtGC0LLQtdGCINC90LDQt9Cw0LQg0LrQvtC90YLQtdC90YIt0YHQutGA0LjQv9GC0YMsINC10YHQu9C4INC90YPQttC90L5cbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTsgLy8g0JTQtdGA0LbQuNC8INC60LDQvdCw0Lsg0YHQstGP0LfQuCDQvtGC0LrRgNGL0YLRi9C8INC00LvRjyDQsNGB0LjQvdGF0YDQvtC90L3QvtCz0L4g0L7RgtCy0LXRgtCwXG4gICAgfVxuICB9KTtcbiAgYnJvd3Nlci5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKFxuICAgIGFzeW5jIChpbmZvLCB0YWIpID0+IHtcbiAgICAgIGlmIChpbmZvLm1lbnVJdGVtSWQgIT09IFwic2F2ZS10by1pbWNcIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIXRhYikgcmV0dXJuO1xuXG4gICAgICBjb25zdCBpc0ltYWdlT3JWaWRlbyA9IGluZm8ubWVkaWFUeXBlID09PSBcImltYWdlXCIgfHwgaW5mby5tZWRpYVR5cGUgPT09IFwidmlkZW9cIjtcbiAgICAgIGlmICghaXNJbWFnZU9yVmlkZW8pIHJldHVybjtcblxuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh0YWIhLnVybCEpO1xuICAgICAgY29uc3QgeyBzdGF0dXMsIGRhdGE6IHVzZXIgfSA9IGF3YWl0IGdldFVzZXIoKTtcbiAgICAgIGlmIChzdGF0dXMgIT09IDIwMCB8fCAhdXNlcikge1xuICAgICAgICBicm93c2VyLnRhYnMuY3JlYXRlKHtcbiAgICAgICAgICB1cmw6IGAke0FQUF9VUkx9L2F1dGgvc2lnbmluP25leHQ9JHt1cmwudG9TdHJpbmcoKX1gLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzb3VyY2VUaXRsZSA9IHRhYj8udGl0bGVcblxuICAgICAgY29uc3Qgc291cmNlVXJsID0gdXJsLnRvU3RyaW5nKClcblxuICAgICAgbGV0IHNvdXJjZUZhdmljb24gPSB0YWI/LmZhdkljb25Vcmw/LnN0YXJ0c1dpdGgoXCJkYXRhOlwiKSA/IG51bGwgOiB0YWI/LmZhdkljb25Vcmw7XG4gICAgICBpZiAoIXNvdXJjZUZhdmljb24gJiYgdGFiLmlkKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCEsIHtcbiAgICAgICAgICB0eXBlOiBcIkdFVF9TT1VSQ0VfREFUQVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgc291cmNlRmF2aWNvbiA9IHJlc3BvbnNlPy5mYXZpY29uO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5mby5zcmNVcmwpIHtcbiAgICAgICAgY29uc3QgY2hlY2tlZFNvdXJjZSA9IGF3YWl0IGNoZWNrU291cmNlKHsgdXJsOiBzb3VyY2VVcmwgfSlcbiAgICAgICAgY29uc3QgYXR0YWNobWVudFVybCA9IHBhcnNlSW1hZ2VVcmwoaW5mby5zcmNVcmwpXG5cbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IGZldGNoQXR0YWNobWVudHMoYXR0YWNobWVudFVybClcbiAgICAgICAgaWYgKCFibG9iKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlsgQVRUQUNITUVOVC1GRVRDSC1GQUlMRUQgXVwiLCBhdHRhY2htZW50VXJsKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IGF3YWl0IHVwbG9hZEF0dGFjaG1lbnQoYmxvYilcbiAgICAgICAgaWYgKCFhdHRhY2htZW50KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlsgQVRUQUNITUVOVC1VUExPQUQtRkFJTEVEIF1cIiwgYXR0YWNobWVudFVybClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlkID0gYXR0YWNobWVudC5pZFxuXG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgIGF3YWl0IGluYm94QXR0YWNobWVudChpZClcbiAgICAgICAgICBpZiAoY2hlY2tlZFNvdXJjZT8uZXhpc3QgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3RTb3VyY2UoeyBzb3VyY2VJRDogY2hlY2tlZFNvdXJjZS5pZCwgYXR0YWNobWVudElEOiBpZCB9KVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCBjcmVhdGVTb3VyY2UoeyB0aXRsZTogc291cmNlVGl0bGUgfHwgdXJsLmhvc3RuYW1lLCB1cmw6IGF0dGFjaG1lbnRVcmwsIGZhdmljb246IHNvdXJjZUZhdmljb24gfHwgdW5kZWZpbmVkLCBhdHRhY2htZW50X2lkOiBpZCB9KVxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgICBhd2FpdCBjb25uZWN0U291cmNlKHsgc291cmNlSUQ6IHNvdXJjZS5pZCwgYXR0YWNobWVudElEOiBpZCB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICk7XG59KTtcbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDldLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLGlCQUFpQixLQUFLO0VBQzlCLElBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxZQUFZLE9BQU8sRUFBRSxNQUFNLElBQUk7RUFDakUsT0FBTztDQUNSOzs7Ozs7Ozs7Ozs7Ozs7OztDRVlBLElBQU0sVURmaUIsV0FBVyxTQUFTLFNBQVMsS0FDaEQsV0FBVyxVQUNYLFdBQVc7OztDRUNmLElBQWEsVUFBQTtDQUNiLElBQWEsVUFBQTs7O0NDSGIsZUFBQSxXQUFBOzs7Ozs7Ozs7Q0FXQTtDQUVBLGVBQUEsVUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBc0JBOzs7Q0N0QkEsZUFBQSxhQUFBLEVBQUEsT0FBQSxLQUFBLFNBQUEsaUJBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUJBO0NBRUEsZUFBQSxZQUFBLEVBQUEsT0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdCQTtDQUVBLGVBQUEsY0FBQSxFQUFBLFVBQUEsZ0JBQUE7Ozs7Ozs7Ozs7Ozs7Q0FrQkE7OztDQ3BGQSxlQUFBLGlCQUFBLEtBQUE7Ozs7Ozs7Q0FTQTtDQUVBLGVBQUEsaUJBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQTtDQUVBLGVBQUEsZ0JBQUEsSUFBQTs7Ozs7Ozs7Q0FjQTs7O0NDaERBLFNBQWdCLGNBQWMsU0FBeUI7RUFDckQsSUFBSTtHQUNGLElBQUksTUFB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