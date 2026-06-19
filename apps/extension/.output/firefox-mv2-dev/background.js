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
	async function createSource({ title, url, favicon, attachment_id }) {
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
			console.log(error);
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
	async function connectSource({ sourceID, attachmentID }) {
		const token = await getToken();
		if (!token) return null;
		try {
			return (await fetch(`https://localhost:8080/v1/source/${sourceID}/connect?attachmentID=${attachmentID}`, {
				method: "POST",
				credentials: "include",
				headers: { "Authorization": `Bearer ${token}` }
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
	//#region src/utils/images.ts
	function parseImageUrl(baseUrl) {
		try {
			let url = new URL(baseUrl);
			const domain = url.hostname;
			console.log("[ DOMAIN ]", domain);
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
			console.log("[ USER ]", user);
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
			if (info.srcUrl) {
				const checkedSource = await checkSource({ url: sourceUrl });
				console.log("[ SOURCE ]", sourceUrl);
				console.log("[ EXIST ]", checkedSource?.exist);
				const attachmentUrl = parseImageUrl(info.srcUrl);
				console.log("[ CLEARED-ATTACHMENT-URL ]", attachmentUrl);
				const attachment = await uploadAttachment(await fetchAttachments(attachmentUrl));
				if (attachment) console.log("[ ATTACHMENT-UPLOADED ]", !!attachment);
				const id = attachment.id;
				if (id) if (checkedSource?.exist === true) {
					console.log("[ CONNECT ]", checkedSource.id, id);
					await connectSource({
						sourceID: checkedSource.id,
						attachmentID: id
					});
				} else {
					console.log("[ CREATE ]", sourceTitle || url.hostname, attachmentUrl);
					const source = await createSource({
						title: sourceTitle || url.hostname,
						url: attachmentUrl,
						favicon: sourceFavicon || void 0,
						attachment_id: id
					});
					if (source) {
						console.log("[ CONNECT ]", source.id, id);
						await connectSource({
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi93eHRAMC4yMC4yNisyMjg3YTQ2NTJmYmI3ZTEyL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad3h0LWRlditicm93c2VyQDAuMS40My9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vd3h0QDAuMjAuMjYrMjI4N2E0NjUyZmJiN2UxMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvYXV0aC50cyIsIi4uLy4uL3NyYy91dGlscy9zb3VyY2UudHMiLCIuLi8uLi9zcmMvdXRpbHMvYXR0YWNobWVudHMudHMiLCIuLi8uLi9zcmMvdXRpbHMvaW1hZ2VzLnRzIiwiLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad2ViZXh0LWNvcmUrbWF0Y2gtcGF0dGVybnNAMS4wLjMvbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtYmFja2dyb3VuZC50c1xuZnVuY3Rpb24gZGVmaW5lQmFja2dyb3VuZChhcmcpIHtcblx0aWYgKGFyZyA9PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHsgbWFpbjogYXJnIH07XG5cdHJldHVybiBhcmc7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUJhY2tncm91bmQgfTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgYnJvd3NlciQxIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvYnJvd3Nlci50c1xuLyoqXG4qIENvbnRhaW5zIHRoZSBgYnJvd3NlcmAgZXhwb3J0IHdoaWNoIHlvdSBzaG91bGQgdXNlIHRvIGFjY2VzcyB0aGUgZXh0ZW5zaW9uXG4qIEFQSXMgaW4geW91ciBwcm9qZWN0OlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnd3h0L2Jyb3dzZXInO1xuKlxuKiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuKiAgIC8vIC4uLlxuKiB9KTtcbiogYGBgXG4qXG4qIEBtb2R1bGUgd3h0L2Jyb3dzZXJcbiovXG5jb25zdCBicm93c2VyID0gYnJvd3NlciQxO1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBicm93c2VyIH07XG4iLCJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUb2tlbigpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdG9yYWdlID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChbJ2ltY190b2tlbiddKTtcbiAgICBjb25zdCB0b2tlbiA9IHN0b3JhZ2UuaW1jX3Rva2VuIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIHJldHVybiB0b2tlbjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VXNlcigpIHtcbiAgdHJ5IHtcblxuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuXG4gICAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vbG9jYWxob3N0OjgwODAvYXV0aC9tZVwiLCB7XG4gICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dG9rZW59YFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xuICAgIGNvbnN0IGlzT2sgPSBzdGF0dXMgPT09IDIwMDtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIHsgZGF0YTogaXNPayA/IGRhdGEgOiBudWxsLCBzdGF0dXMsIGVycm9yOiAhaXNPayA/IGRhdGEubWVzc2FnZSA6IG51bGwgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLCBzdGF0dXM6IDUwMCwgZGF0YTogbnVsbCB9O1xuICB9XG59XG4iLCJcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U291cmNlRGF0YSgpIHtcbiAgY29uc3QgZmF2aWNvbiA9XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTGlua0VsZW1lbnQ+KFxuICAgICAgJ2xpbmtbcmVsfj1cImljb25cIl0sIGxpbmtbcmVsPVwic2hvcnRjdXQgaWNvblwiXScsXG4gICAgKT8uaHJlZiA/PyBudWxsO1xuICBjb25zb2xlLmxvZyhcImZhdmljb24tXCIsIGZhdmljb24pXG4gIHJldHVybiB7XG4gICAgZmF2aWNvblxuICB9O1xufVxuXG5cblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlU291cmNlKHsgdGl0bGUsIHVybCwgZmF2aWNvbiwgYXR0YWNobWVudF9pZCB9OiB7IHRpdGxlOiBzdHJpbmc7IHVybDogc3RyaW5nLCBmYXZpY29uPzogc3RyaW5nLCBhdHRhY2htZW50X2lkPzogc3RyaW5nIH0pIHtcbiAgY29uc3QgdXJsSW5zdGFuY2UgPSBuZXcgVVJMKHVybClcbiAgY29uc3QgZG9tYWluID0gdXJsSW5zdGFuY2UuaG9zdG5hbWU7XG4gIGNvbnN0IHNsdWcgPSB1cmxJbnN0YW5jZS5wYXRobmFtZTtcbiAgdHJ5IHtcbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKClcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vbG9jYWxob3N0OjgwODAvdjEvc291cmNlL25ld1wiLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBuYW1lOiB0aXRsZSwgZG9tYWluLCBzbHVnLCBmYXZpY29uX3VybDogZmF2aWNvbiwgYXR0YWNobWVudF9pZCB9KSxcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja1NvdXJjZSh7IHVybCB9OiB7IHVybDogc3RyaW5nIH0pOiBQcm9taXNlPHsgaWQ6IHN0cmluZywgZXhpc3Q6IGJvb2xlYW4gfSB8IG51bGw+IHtcblxuICBjb25zdCB1cmxJbnN0YW5jZSA9IG5ldyBVUkwodXJsKVxuICBjb25zdCBkb21haW4gPSB1cmxJbnN0YW5jZS5ob3N0bmFtZTtcbiAgY29uc3Qgc2x1ZyA9IHVybEluc3RhbmNlLnBhdGhuYW1lO1xuXG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuICBpZiAoIXRva2VuKSByZXR1cm4gbnVsbFxuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9zb3VyY2UvY2hlY2s/ZG9tYWluPSR7ZG9tYWlufSZzbHVnPSR7c2x1Z31gLCB7XG4gICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dG9rZW59YCxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29ubmVjdFNvdXJjZSh7IHNvdXJjZUlELCBhdHRhY2htZW50SUQgfTogeyBzb3VyY2VJRDogc3RyaW5nOyBhdHRhY2htZW50SUQ6IHN0cmluZyB9KSB7XG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuICBpZiAoIXRva2VuKSByZXR1cm4gbnVsbFxuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9zb3VyY2UvJHtzb3VyY2VJRH0vY29ubmVjdD9hdHRhY2htZW50SUQ9JHthdHRhY2htZW50SUR9YCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cbiIsIlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQXR0YWNobWVudHModXJsOiBzdHJpbmcpIHtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICByZXR1cm4gZGF0YTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwbG9hZEF0dGFjaG1lbnQoZmlsZTogQmxvYikge1xuICB0cnkge1xuXG4gICAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbigpXG5cbiAgICBpZiAoIXRva2VuKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB0b2tlbiBmb3VuZFwiKTtcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpXG5cbiAgICBmb3JtRGF0YS5hcHBlbmQoXCJmaWxlXCIsIGZpbGUpXG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9teS9hdHRhY2htZW50cy9uZXdcIiwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuIiwiXG5cblxuLy8g0K3RgtCwINGE0YPQvdC60YbQuNGPINC90YPQttC90LAg0YfRgtC+0LHRiyDRh9C40YHRgtC40YLRjCDRgdGB0YvQu9C60Lgg0L7RgiDRhNC+0YDQvNCw0YLQuNGA0L7QstCw0L3QuNC5INC60LDRgNGC0LjQvdC+0LosINC/0L4g0YLQuNC/0LAgbmFtZT0zNjB4MzYwXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbWFnZVVybChiYXNlVXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIGxldCB1cmwgPSBuZXcgVVJMKGJhc2VVcmwpXG4gICAgY29uc3QgZG9tYWluID0gdXJsLmhvc3RuYW1lXG5cbiAgICBjb25zb2xlLmxvZyhcIlsgRE9NQUlOIF1cIiwgZG9tYWluKVxuXG4gICAgaWYgKGRvbWFpbi5lbmRzV2l0aChcInR3aW1nLmNvbVwiKSkge1xuICAgICAgdXJsID0gY2xlYW5YY29tVXJsKHVybClcbiAgICB9XG4gICAgaWYgKGRvbWFpbi5lbmRzV2l0aChcImRyaWJiYmxlLmNvbVwiKSkge1xuICAgICAgdXJsID0gY2xlYW5EcmliYmJsZVVybCh1cmwpXG4gICAgfVxuXG4gICAgcmV0dXJuIHVybC50b1N0cmluZygpXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBiYXNlVXJsXG4gIH1cbn1cblxuZnVuY3Rpb24gY2xlYW5YY29tVXJsKHVybDogVVJMKTogVVJMIHtcbiAgY29uc3QgaGFzTmFtZVBhcmFtID0gdXJsLnNlYXJjaFBhcmFtcy5oYXMoXCJuYW1lXCIpXG4gIGlmIChoYXNOYW1lUGFyYW0pIHtcbiAgICB1cmwuc2VhcmNoUGFyYW1zLmRlbGV0ZShcIm5hbWVcIilcbiAgfVxuICByZXR1cm4gdXJsXG59XG5cbmZ1bmN0aW9uIGNsZWFuRHJpYmJibGVVcmwodXJsOiBVUkwpOiBVUkwge1xuICBjb25zdCBoYXNOYW1lUGFyYW0gPSB1cmwuc2VhcmNoUGFyYW1zLmhhcyhcInJlc2l6ZVwiKVxuICBpZiAoaGFzTmFtZVBhcmFtKSB7XG4gICAgdXJsLnNlYXJjaFBhcmFtcy5kZWxldGUoXCJyZXNpemVcIilcbiAgfVxuICByZXR1cm4gdXJsXG59XG4iLCJpbXBvcnQgeyBnZXRVc2VyIH0gZnJvbSBcIkAvdXRpbHMvYXV0aFwiO1xuaW1wb3J0IHsgcGFyc2VJbWFnZVVybCB9IGZyb20gXCJAL3V0aWxzL2ltYWdlc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVCYWNrZ3JvdW5kKCgpID0+IHtcbiAgYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGFzeW5jICgpID0+IHtcbiAgICBicm93c2VyXG4gICAgICAuY29udGV4dE1lbnVzXG4gICAgICAuY3JlYXRlKHtcbiAgICAgICAgaWQ6IFwic2F2ZS10by1pbWNcIixcbiAgICAgICAgdGl0bGU6IFwi0KHQvtGF0YDQsNC90LjRgtGMINCyIElNQ1wiLFxuICAgICAgICBjb250ZXh0czogW1wiaW1hZ2VcIiwgXCJ2aWRlb1wiXSxcbiAgICAgIH0pO1xuICB9KTtcbiAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcblxuICAgIGNvbnNvbGUubG9nKFwiWyBNRVNTQUdFIF1cIiwgbWVzc2FnZSlcbiAgICAvLyDQn9GA0L7QstC10YDRj9C10Lwg0YLQuNC/INGB0L7QvtCx0YnQtdC90LjRjywg0LrQvtGC0L7RgNC+0LUg0L/RgNC40YHQu9Cw0Lsg0L3QsNGIINC60L7QvdGC0LXQvdGCLdGB0LrRgNC40L/RglxuICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UudHlwZSA9PT0gXCJBVVRIX1NVQ0NFU1NcIiAmJiBtZXNzYWdlLnRva2VuKSB7XG5cbiAgICAgIC8vINCh0L7RhdGA0LDQvdGP0LXQvCDRgtC+0LrQtdC9INCy0L4g0LLQvdGD0YLRgNC10L3QvdGO0Y4g0LHQtdC30L7Qv9Cw0YHQvdGD0Y4g0L/QsNC80Y/RgtGMINGA0LDRgdGI0LjRgNC10L3QuNGPXG4gICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHsgaW1jX3Rva2VuOiBtZXNzYWdlLnRva2VuIH0sICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCLQo9GA0LAhINCi0L7QutC10L0g0YHQvtGF0YDQsNC90LXQvSDQstC90YPRgtGA0Lgg0YDQsNGB0YjQuNGA0LXQvdC40Y8uXCIpO1xuXG4gICAgICAgIC8vINCe0L/RhtC40L7QvdCw0LvRjNC90L46INC+0YLQv9GA0LDQstC70Y/QtdC8INC+0YLQstC10YIg0L3QsNC30LDQtCDQutC+0L3RgtC10L3Rgi3RgdC60YDQuNC/0YLRgywg0LXRgdC70Lgg0L3Rg9C20L3QvlxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlOyAvLyDQlNC10YDQttC40Lwg0LrQsNC90LDQuyDRgdCy0Y/Qt9C4INC+0YLQutGA0YvRgtGL0Lwg0LTQu9GPINCw0YHQuNC90YXRgNC+0L3QvdC+0LPQviDQvtGC0LLQtdGC0LBcbiAgICB9XG4gIH0pO1xuICBicm93c2VyLmNvbnRleHRNZW51cy5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoXG4gICAgYXN5bmMgKGluZm8sIHRhYikgPT4ge1xuICAgICAgaWYgKGluZm8ubWVudUl0ZW1JZCAhPT0gXCJzYXZlLXRvLWltY1wiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghdGFiKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGlzSW1hZ2VPclZpZGVvID0gaW5mby5tZWRpYVR5cGUgPT09IFwiaW1hZ2VcIiB8fCBpbmZvLm1lZGlhVHlwZSA9PT0gXCJ2aWRlb1wiO1xuICAgICAgaWYgKCFpc0ltYWdlT3JWaWRlbykgcmV0dXJuO1xuXG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHRhYiEudXJsISk7XG4gICAgICBjb25zdCB7IHN0YXR1cywgZGF0YTogdXNlciB9ID0gYXdhaXQgZ2V0VXNlcigpO1xuICAgICAgY29uc29sZS5sb2coXCJbIFVTRVIgXVwiLCB1c2VyKVxuICAgICAgaWYgKHN0YXR1cyAhPT0gMjAwIHx8ICF1c2VyKSB7XG4gICAgICAgIGJyb3dzZXIudGFicy5jcmVhdGUoe1xuICAgICAgICAgIHVybDogYGh0dHA6Ly9sb2NhbGhvc3Q6NTE3My9hdXRoL3NpZ25pbj9uZXh0PSR7dXJsLnRvU3RyaW5nKCl9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc291cmNlVGl0bGUgPSB0YWI/LnRpdGxlXG5cbiAgICAgIGNvbnN0IHNvdXJjZVVybCA9IHVybC50b1N0cmluZygpXG5cbiAgICAgIGxldCBzb3VyY2VGYXZpY29uID0gdGFiPy5mYXZJY29uVXJsPy5zdGFydHNXaXRoKFwiZGF0YTpcIikgPyBudWxsIDogdGFiPy5mYXZJY29uVXJsO1xuICAgICAgY29uc29sZS5sb2coXCJbIEZBVklDT04gXVwiLCBzb3VyY2VGYXZpY29uKVxuICAgICAgaWYgKCFzb3VyY2VGYXZpY29uICYmIHRhYi5pZCkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQhLCB7XG4gICAgICAgICAgdHlwZTogXCJHRVRfU09VUkNFX0RBVEFcIixcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiWyBTT1VSQ0UtREFUQSBdXCIsIHJlc3BvbnNlKTtcbiAgICAgICAgc291cmNlRmF2aWNvbiA9IHJlc3BvbnNlPy5mYXZpY29uO1xuICAgICAgfVxuXG4gICAgICAvLyBjb25zdCBzb3VyY2UgPSB7XG4gICAgICAvLyAgIHRpdGxlOiBzb3VyY2VUaXRsZSxcbiAgICAgIC8vICAgdXJsOiBzb3VyY2VVcmwsXG4gICAgICAvLyAgIGZhdmljb246IHNvdXJjZUZhdmljb24sXG4gICAgICAvLyB9XG5cblxuICAgICAgLy8gY29uc3QgZmlsZW5hbWVBcnJheSA9IChuZXcgVVJMKGluZm8/LnNyY1VybCB8fCBcIlwiKS5wYXRobmFtZSk/LnNwbGl0KFwiL1wiKVxuICAgICAgLy8gY29uc3QgZmlsZW5hbWUgPSBmaWxlbmFtZUFycmF5Py5bZmlsZW5hbWVBcnJheS5sZW5ndGggLSAxXTtcblxuICAgICAgLy8gY29uc3QgYXR0YWNobWVudCA9IHtcbiAgICAgIC8vICAgc3JjOiBpbmZvPy5zcmNVcmwsXG4gICAgICAvLyAgIHRpdGxlOiBgJHtzb3VyY2VUaXRsZX0gLSAke2ZpbGVuYW1lfWAsXG4gICAgICAvLyAgIGZpbGVuYW1lLFxuICAgICAgLy8gfVxuXG4gICAgICBpZiAoaW5mby5zcmNVcmwpIHtcblxuICAgICAgICBjb25zdCBjaGVja2VkU291cmNlID0gYXdhaXQgY2hlY2tTb3VyY2UoeyB1cmw6IHNvdXJjZVVybCB9KVxuICAgICAgICBjb25zb2xlLmxvZyhcIlsgU09VUkNFIF1cIiwgc291cmNlVXJsKVxuICAgICAgICBjb25zb2xlLmxvZyhcIlsgRVhJU1QgXVwiLCBjaGVja2VkU291cmNlPy5leGlzdClcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJjaGVja2VkU291cmNlXCIsIGNoZWNrZWRTb3VyY2UsIHNvdXJjZVVybClcblxuICAgICAgICBjb25zdCBhdHRhY2htZW50VXJsID0gcGFyc2VJbWFnZVVybChpbmZvLnNyY1VybClcbiAgICAgICAgY29uc29sZS5sb2coXCJbIENMRUFSRUQtQVRUQUNITUVOVC1VUkwgXVwiLCBhdHRhY2htZW50VXJsKVxuXG4gICAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBmZXRjaEF0dGFjaG1lbnRzKGF0dGFjaG1lbnRVcmwpXG4gICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSBhd2FpdCB1cGxvYWRBdHRhY2htZW50KGJsb2IpXG4gICAgICAgIGlmIChhdHRhY2htZW50KSBjb25zb2xlLmxvZyhcIlsgQVRUQUNITUVOVC1VUExPQURFRCBdXCIsICEhYXR0YWNobWVudClcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJhdHRhY2htZW50XCIsIGF0dGFjaG1lbnQpXG5cbiAgICAgICAgY29uc3QgaWQgPSBhdHRhY2htZW50LmlkXG5cbiAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgaWYgKGNoZWNrZWRTb3VyY2U/LmV4aXN0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlsgQ09OTkVDVCBdXCIsIGNoZWNrZWRTb3VyY2UuaWQsIGlkKVxuICAgICAgICAgICAgYXdhaXQgY29ubmVjdFNvdXJjZSh7IHNvdXJjZUlEOiBjaGVja2VkU291cmNlLmlkLCBhdHRhY2htZW50SUQ6IGlkIH0pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWyBDUkVBVEUgXVwiLCBzb3VyY2VUaXRsZSB8fCB1cmwuaG9zdG5hbWUsIGF0dGFjaG1lbnRVcmwpXG4gICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCBjcmVhdGVTb3VyY2UoeyB0aXRsZTogc291cmNlVGl0bGUgfHwgdXJsLmhvc3RuYW1lLCB1cmw6IGF0dGFjaG1lbnRVcmwsIGZhdmljb246IHNvdXJjZUZhdmljb24gfHwgdW5kZWZpbmVkLCBhdHRhY2htZW50X2lkOiBpZCB9KVxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlsgQ09OTkVDVCBdXCIsIHNvdXJjZS5pZCwgaWQpXG4gICAgICAgICAgICAgIGF3YWl0IGNvbm5lY3RTb3VyY2UoeyBzb3VyY2VJRDogc291cmNlLmlkLCBhdHRhY2htZW50SUQ6IGlkIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cblxuICAgICAgLy8gY29uc29sZS5sb2coXCJmYXZpY29uXCIsIHNvdXJjZUZhdmljb24pXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInNvdXJjZVwiLCBzb3VyY2UpXG4gICAgICAvLyBjb25zb2xlLmxvZyhhdHRhY2htZW50KTtcbiAgICB9LFxuICApO1xufSk7XG4iLCIvLyBzcmMvaW5kZXgudHNcbnZhciBfTWF0Y2hQYXR0ZXJuID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4pIHtcbiAgICBpZiAobWF0Y2hQYXR0ZXJuID09PSBcIjxhbGxfdXJscz5cIikge1xuICAgICAgdGhpcy5pc0FsbFVybHMgPSB0cnVlO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBbLi4uX01hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG4gICAgICBpZiAoZ3JvdXBzID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuICAgICAgY29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuICAgICAgdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcbiAgICAgIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG4gICAgICB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcbiAgICB9XG4gIH1cbiAgaW5jbHVkZXModXJsKSB7XG4gICAgaWYgKHRoaXMuaXNBbGxVcmxzKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuICAgIHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcbiAgICB9KTtcbiAgfVxuICBpc0h0dHBNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0h0dHBzTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RuYW1lTWF0Y2hSZWdleHMgPSBbXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLFxuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoLnJlcGxhY2UoL15cXCpcXC4vLCBcIlwiKSlcbiAgICBdO1xuICAgIGNvbnN0IHBhdGhuYW1lTWF0Y2hSZWdleCA9IHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCk7XG4gICAgcmV0dXJuICEhaG9zdG5hbWVNYXRjaFJlZ2V4cy5maW5kKChyZWdleCkgPT4gcmVnZXgudGVzdCh1cmwuaG9zdG5hbWUpKSAmJiBwYXRobmFtZU1hdGNoUmVnZXgudGVzdCh1cmwucGF0aG5hbWUpO1xuICB9XG4gIGlzRmlsZU1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmaWxlOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc0Z0cE1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzVXJuTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgY29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKTtcbiAgICBjb25zdCBzdGFyc1JlcGxhY2VkID0gZXNjYXBlZC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG4gICAgcmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG4gIH1cbiAgZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn07XG52YXIgTWF0Y2hQYXR0ZXJuID0gX01hdGNoUGF0dGVybjtcbk1hdGNoUGF0dGVybi5QUk9UT0NPTFMgPSBbXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJmaWxlXCIsIFwiZnRwXCIsIFwidXJuXCJdO1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuICB9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG4gIGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYEhvc3RuYW1lIGNhbm5vdCBpbmNsdWRlIGEgcG9ydGApO1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCIqXCIpICYmIGhvc3RuYW1lLmxlbmd0aCA+IDEgJiYgIWhvc3RuYW1lLnN0YXJ0c1dpdGgoXCIqLlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpIHtcbiAgcmV0dXJuO1xufVxuZXhwb3J0IHtcbiAgSW52YWxpZE1hdGNoUGF0dGVybixcbiAgTWF0Y2hQYXR0ZXJuXG59O1xuIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiw4XSwibWFwcGluZ3MiOiI7O0NBQ0EsU0FBUyxpQkFBaUIsS0FBSztFQUM5QixJQUFJLE9BQU8sUUFBUSxPQUFPLFFBQVEsWUFBWSxPQUFPLEVBQUUsTUFBTSxJQUFJO0VBQ2pFLE9BQU87Q0FDUjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VZQSxJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcsVUFDWCxXQUFXOzs7Q0VGZixlQUFBLFdBQUE7Ozs7Ozs7OztDQVdBO0NBRUEsZUFBQSxVQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FzQkE7OztDQ25CQSxlQUFBLGFBQUEsRUFBQSxPQUFBLEtBQUEsU0FBQSxpQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5QkE7Q0FFQSxlQUFBLFlBQUEsRUFBQSxPQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBd0JBO0NBRUEsZUFBQSxjQUFBLEVBQUEsVUFBQSxnQkFBQTs7Ozs7Ozs7Ozs7OztDQWtCQTs7O0NDdkZBLGVBQUEsaUJBQUEsS0FBQTs7Q0FJQTtDQUVBLGVBQUEsaUJBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQTs7O0NDMUJBLFNBQWdCLGNBQWMsU0FBeUI7RUFDckQsSUFBSTtHQUNGLElBQUksTUFBTSxJQUFJLElBQUksT0FBTztHQUN6QixNQUFNLFNBQVMsSUFBSTtHQUVuQixRQUFRLElBQUksY0FBYyxNQUFNO0dBRWhDLElBQUksT0FBTyxTQUFTLFdBQVcsR0FDN0IsTUFBTSxhQUFhLEdBQUc7R0FFeEIsSUFBSSxPQUFPLFNBQVMsY0FBYyxHQUNoQyxNQUFNLGlCQUFpQixHQUFHO0dBRzVCLE9BQU8sSUFBSSxTQUFTO0VBQ3RCLFFBQVE7R0FDTixPQUFPO0VBQ1Q7Q0FDRjtDQUVBLFNBQVMsYUFBYSxLQUFlO0VBRW5DLElBRHFCLElBQUksYUFBYSxJQUFJLE1BQ3RDLEdBQ0YsSUFBSSxhQUFhLE9BQU8sTUFBTTtFQUVoQyxPQUFPO0NBQ1Q7Q0FFQSxTQUFTLGlCQUFpQixLQUFlO0VBRXZDLElBRHFCLElBQUksYUFBYSxJQUFJLFFBQ3RDLEdBQ0YsSUFBSSxhQUFhLE9BQU8sUUFBUTtFQUVsQyxPQUFPO0NBQ1Q7OztDQ25DQSxJQUFBLHFCQUFBLHVCQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1IQSxDQUFBOzs7Q0NySEEsSUFBSSxnQkFBZ0IsTUFBTTtFQUN4QixZQUFZLGNBQWM7R0FDeEIsSUFBSSxpQkFBaUIsY0FBYztJQUNqQyxLQUFLLFlBQVk7SUFDakIsS0FBSyxrQkFBa0IsQ0FBQyxHQUFHLGNBQWMsU0FBUztJQUNsRCxLQUFLLGdCQUFnQjtJQUNyQixLQUFLLGdCQUFnQjtHQUN2QixPQUFPO0lBQ0wsTUFBTSxTQUFTLHVCQUF1QixLQUFLLFlBQVk7SUFDdkQsSUFBSSxVQUFVLE1BQ1osTUFBTSxJQUFJLG9CQUFvQixjQUFjLGtCQUFrQjtJQUNoRSxNQUFNLENBQUMsR0FBRyxVQUFVLFVBQVUsWUFBWTtJQUMxQyxpQkFBaUIsY0FBYyxRQUFRO0lBQ3ZDLGlCQUFpQixjQUFjLFFBQVE7SUFFdkMsS0FBSyxrQkFBa0IsYUFBYSxNQUFNLENBQUMsUUFBUSxPQUFPLElBQUksQ0FBQyxRQUFRO0lBQ3ZFLEtBQUssZ0JBQWdCO0lBQ3JCLEtBQUssZ0JBQWdCO0dBQ3ZCO0VBQ0Y7RUFDQSxTQUFTLEtBQUs7R0FDWixJQUFJLEtBQUssV0FDUCxPQUFPO0dBQ1QsTUFBTSxJQUFJLE9BQU8sUUFBUSxXQUFXLElBQUksSUFBSSxHQUFHLElBQUksZUFBZSxXQUFXLElBQUksSUFBSSxJQUFJLElBQUksSUFBSTtHQUNqRyxPQUFPLENBQUMsQ0FBQyxLQUFLLGdCQUFnQixNQUFNLGFBQWE7SUFDL0MsSUFBSSxhQUFhLFFBQ2YsT0FBTyxLQUFLLFlBQVksQ0FBQztJQUMzQixJQUFJLGFBQWEsU0FDZixPQUFPLEtBQUssYUFBYSxDQUFDO0lBQzVCLElBQUksYUFBYSxRQUNmLE9BQU8sS0FBSyxZQUFZLENBQUM7SUFDM0IsSUFBSSxhQUFhLE9BQ2YsT0FBTyxLQUFLLFdBQVcsQ0FBQztJQUMxQixJQUFJLGFBQWEsT0FDZixPQUFPLEtBQUssV0FBVyxDQUFDO0dBQzVCLENBQUM7RUFDSDtFQUNBLFlBQVksS0FBSztHQUNmLE9BQU8sSUFBSSxhQUFhLFdBQVcsS0FBSyxnQkFBZ0IsR0FBRztFQUM3RDtFQUNBLGFBQWEsS0FBSztHQUNoQixPQUFPLElBQUksYUFBYSxZQUFZLEtBQUssZ0JBQWdCLEdBQUc7RUFDOUQ7RUFDQSxnQkFBZ0IsS0FBSztHQUNuQixJQUFJLENBQUMsS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLGVBQy9CLE9BQU87R0FDVCxNQUFNLHNCQUFzQixDQUMxQixLQUFLLHNCQUFzQixLQUFLLGFBQWEsR0FDN0MsS0FBSyxzQkFBc0IsS0FBSyxjQUFjLFFBQVEsU0FBUyxFQUFFLENBQUMsQ0FDcEU7R0FDQSxNQUFNLHFCQUFxQixLQUFLLHNCQUFzQixLQUFLLGFBQWE7R0FDeEUsT0FBTyxDQUFDLENBQUMsb0JBQW9CLE1BQU0sVUFBVSxNQUFNLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxtQkFBbUIsS0FBSyxJQUFJLFFBQVE7RUFDaEg7RUFDQSxZQUFZLEtBQUs7R0FDZixNQUFNLE1BQU0scUVBQXFFO0VBQ25GO0VBQ0EsV0FBVyxLQUFLO0dBQ2QsTUFBTSxNQUFNLG9FQUFvRTtFQUNsRjtFQUNBLFdBQVcsS0FBSztHQUNkLE1BQU0sTUFBTSxvRUFBb0U7RUFDbEY7RUFDQSxzQkFBc0IsU0FBUztHQUU3QixNQUFNLGdCQURVLEtBQUssZUFBZSxPQUNSLEVBQUUsUUFBUSxTQUFTLElBQUk7R0FDbkQsT0FBTyxPQUFPLElBQUksY0FBYyxFQUFFO0VBQ3BDO0VBQ0EsZUFBZSxRQUFRO0dBQ3JCLE9BQU8sT0FBTyxRQUFRLHVCQUF1QixNQUFNO0VBQ3JEO0NBQ0Y7Q0FDQSxJQUFJLGVBQWU7Q0FDbkIsYUFBYSxZQUFZO0VBQUM7RUFBUTtFQUFTO0VBQVE7RUFBTztDQUFLO0NBQy9ELElBQUksc0JBQXNCLGNBQWMsTUFBTTtFQUM1QyxZQUFZLGNBQWMsUUFBUTtHQUNoQyxNQUFNLDBCQUEwQixhQUFhLEtBQUssUUFBUTtFQUM1RDtDQUNGO0NBQ0EsU0FBUyxpQkFBaUIsY0FBYyxVQUFVO0VBQ2hELElBQUksQ0FBQyxhQUFhLFVBQVUsU0FBUyxRQUFRLEtBQUssYUFBYSxLQUM3RCxNQUFNLElBQUksb0JBQ1IsY0FDQSxHQUFHLFNBQVMseUJBQXlCLGFBQWEsVUFBVSxLQUFLLElBQUksRUFBRSxFQUN6RTtDQUNKO0NBQ0EsU0FBUyxpQkFBaUIsY0FBYyxVQUFVO0VBQ2hELElBQUksU0FBUyxTQUFTLEdBQUcsR0FDdkIsTUFBTSxJQUFJLG9CQUFvQixjQUFjLGdDQUFnQztFQUM5RSxJQUFJLFNBQVMsU0FBUyxHQUFHLEtBQUssU0FBUyxTQUFTLEtBQUssQ0FBQyxTQUFTLFdBQVcsSUFBSSxHQUM1RSxNQUFNLElBQUksb0JBQ1IsY0FDQSxrRUFDRjtDQUNKIn0=