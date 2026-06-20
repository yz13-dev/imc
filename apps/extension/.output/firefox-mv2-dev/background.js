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
	async function inboxAttachment(id) {
		const token = await getToken();
		if (!token) throw new Error("No token found");
		return { status: (await fetch(`https://localhost:8080/v1/my/attachments/inbox?attachmentID=${id}`, {
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
				if (id) {
					const { status: attachmentStatus } = await inboxAttachment(id);
					console.log("[ INBOXED ]", attachmentStatus === 201);
					if (checkedSource?.exist === true) {
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi93eHRAMC4yMC4yNisyMjg3YTQ2NTJmYmI3ZTEyL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad3h0LWRlditicm93c2VyQDAuMS40My9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vd3h0QDAuMjAuMjYrMjI4N2E0NjUyZmJiN2UxMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvYXV0aC50cyIsIi4uLy4uL3NyYy91dGlscy9zb3VyY2UudHMiLCIuLi8uLi9zcmMvdXRpbHMvYXR0YWNobWVudHMudHMiLCIuLi8uLi9zcmMvdXRpbHMvaW1hZ2VzLnRzIiwiLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9Ad2ViZXh0LWNvcmUrbWF0Y2gtcGF0dGVybnNAMS4wLjMvbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtYmFja2dyb3VuZC50c1xuZnVuY3Rpb24gZGVmaW5lQmFja2dyb3VuZChhcmcpIHtcblx0aWYgKGFyZyA9PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHsgbWFpbjogYXJnIH07XG5cdHJldHVybiBhcmc7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUJhY2tncm91bmQgfTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgYnJvd3NlciQxIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvYnJvd3Nlci50c1xuLyoqXG4qIENvbnRhaW5zIHRoZSBgYnJvd3NlcmAgZXhwb3J0IHdoaWNoIHlvdSBzaG91bGQgdXNlIHRvIGFjY2VzcyB0aGUgZXh0ZW5zaW9uXG4qIEFQSXMgaW4geW91ciBwcm9qZWN0OlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnd3h0L2Jyb3dzZXInO1xuKlxuKiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuKiAgIC8vIC4uLlxuKiB9KTtcbiogYGBgXG4qXG4qIEBtb2R1bGUgd3h0L2Jyb3dzZXJcbiovXG5jb25zdCBicm93c2VyID0gYnJvd3NlciQxO1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBicm93c2VyIH07XG4iLCJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUb2tlbigpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdG9yYWdlID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChbJ2ltY190b2tlbiddKTtcbiAgICBjb25zdCB0b2tlbiA9IHN0b3JhZ2UuaW1jX3Rva2VuIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuICAgIHJldHVybiB0b2tlbjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VXNlcigpIHtcbiAgdHJ5IHtcblxuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuXG4gICAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vbG9jYWxob3N0OjgwODAvYXV0aC9tZVwiLCB7XG4gICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dG9rZW59YFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xuICAgIGNvbnN0IGlzT2sgPSBzdGF0dXMgPT09IDIwMDtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIHsgZGF0YTogaXNPayA/IGRhdGEgOiBudWxsLCBzdGF0dXMsIGVycm9yOiAhaXNPayA/IGRhdGEubWVzc2FnZSA6IG51bGwgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLCBzdGF0dXM6IDUwMCwgZGF0YTogbnVsbCB9O1xuICB9XG59XG4iLCJcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U291cmNlRGF0YSgpIHtcbiAgY29uc3QgZmF2aWNvbiA9XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTGlua0VsZW1lbnQ+KFxuICAgICAgJ2xpbmtbcmVsfj1cImljb25cIl0sIGxpbmtbcmVsPVwic2hvcnRjdXQgaWNvblwiXScsXG4gICAgKT8uaHJlZiA/PyBudWxsO1xuICBjb25zb2xlLmxvZyhcImZhdmljb24tXCIsIGZhdmljb24pXG4gIHJldHVybiB7XG4gICAgZmF2aWNvblxuICB9O1xufVxuXG5cblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlU291cmNlKHsgdGl0bGUsIHVybCwgZmF2aWNvbiwgYXR0YWNobWVudF9pZCB9OiB7IHRpdGxlOiBzdHJpbmc7IHVybDogc3RyaW5nLCBmYXZpY29uPzogc3RyaW5nLCBhdHRhY2htZW50X2lkPzogc3RyaW5nIH0pIHtcbiAgY29uc3QgdXJsSW5zdGFuY2UgPSBuZXcgVVJMKHVybClcbiAgY29uc3QgZG9tYWluID0gdXJsSW5zdGFuY2UuaG9zdG5hbWU7XG4gIGNvbnN0IHNsdWcgPSB1cmxJbnN0YW5jZS5wYXRobmFtZTtcbiAgdHJ5IHtcbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKClcblxuICAgIGlmICghdG9rZW4pIHRocm93IG5ldyBFcnJvcihcIk5vIHRva2VuIGZvdW5kXCIpO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vbG9jYWxob3N0OjgwODAvdjEvc291cmNlL25ld1wiLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBuYW1lOiB0aXRsZSwgZG9tYWluLCBzbHVnLCBmYXZpY29uX3VybDogZmF2aWNvbiwgYXR0YWNobWVudF9pZCB9KSxcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja1NvdXJjZSh7IHVybCB9OiB7IHVybDogc3RyaW5nIH0pOiBQcm9taXNlPHsgaWQ6IHN0cmluZywgZXhpc3Q6IGJvb2xlYW4gfSB8IG51bGw+IHtcblxuICBjb25zdCB1cmxJbnN0YW5jZSA9IG5ldyBVUkwodXJsKVxuICBjb25zdCBkb21haW4gPSB1cmxJbnN0YW5jZS5ob3N0bmFtZTtcbiAgY29uc3Qgc2x1ZyA9IHVybEluc3RhbmNlLnBhdGhuYW1lO1xuXG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuICBpZiAoIXRva2VuKSByZXR1cm4gbnVsbFxuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9zb3VyY2UvY2hlY2s/ZG9tYWluPSR7ZG9tYWlufSZzbHVnPSR7c2x1Z31gLCB7XG4gICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dG9rZW59YCxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29ubmVjdFNvdXJjZSh7IHNvdXJjZUlELCBhdHRhY2htZW50SUQgfTogeyBzb3VyY2VJRDogc3RyaW5nOyBhdHRhY2htZW50SUQ6IHN0cmluZyB9KSB7XG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oKVxuICBpZiAoIXRva2VuKSByZXR1cm4gbnVsbFxuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9zb3VyY2UvJHtzb3VyY2VJRH0vY29ubmVjdD9hdHRhY2htZW50SUQ9JHthdHRhY2htZW50SUR9YCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cbiIsIlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQXR0YWNobWVudHModXJsOiBzdHJpbmcpIHtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICByZXR1cm4gZGF0YTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwbG9hZEF0dGFjaG1lbnQoZmlsZTogQmxvYikge1xuICB0cnkge1xuXG4gICAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbigpXG5cbiAgICBpZiAoIXRva2VuKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB0b2tlbiBmb3VuZFwiKTtcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpXG5cbiAgICBmb3JtRGF0YS5hcHBlbmQoXCJmaWxlXCIsIGZpbGUpXG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9teS9hdHRhY2htZW50cy9uZXdcIiwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5ib3hBdHRhY2htZW50KGlkOiBzdHJpbmcpIHtcbiAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbigpXG5cbiAgaWYgKCF0b2tlbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gdG9rZW4gZm91bmRcIik7XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9sb2NhbGhvc3Q6ODA4MC92MS9teS9hdHRhY2htZW50cy9pbmJveD9hdHRhY2htZW50SUQ9JHtpZH1gLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHt0b2tlbn1gXG4gICAgfVxuICB9KTtcbiAgY29uc3Qgc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xuICByZXR1cm4geyBzdGF0dXMgfTtcbn1cbiIsIlxuXG5cbi8vINCt0YLQsCDRhNGD0L3QutGG0LjRjyDQvdGD0LbQvdCwINGH0YLQvtCx0Ysg0YfQuNGB0YLQuNGC0Ywg0YHRgdGL0LvQutC4INC+0YIg0YTQvtGA0LzQsNGC0LjRgNC+0LLQsNC90LjQuSDQutCw0YDRgtC40L3QvtC6LCDQv9C+INGC0LjQv9CwIG5hbWU9MzYweDM2MFxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW1hZ2VVcmwoYmFzZVVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBsZXQgdXJsID0gbmV3IFVSTChiYXNlVXJsKVxuICAgIGNvbnN0IGRvbWFpbiA9IHVybC5ob3N0bmFtZVxuXG4gICAgY29uc29sZS5sb2coXCJbIERPTUFJTiBdXCIsIGRvbWFpbilcblxuICAgIGlmIChkb21haW4uZW5kc1dpdGgoXCJ0d2ltZy5jb21cIikpIHtcbiAgICAgIHVybCA9IGNsZWFuWGNvbVVybCh1cmwpXG4gICAgfVxuICAgIGlmIChkb21haW4uZW5kc1dpdGgoXCJkcmliYmJsZS5jb21cIikpIHtcbiAgICAgIHVybCA9IGNsZWFuRHJpYmJibGVVcmwodXJsKVxuICAgIH1cblxuICAgIHJldHVybiB1cmwudG9TdHJpbmcoKVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gYmFzZVVybFxuICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFuWGNvbVVybCh1cmw6IFVSTCk6IFVSTCB7XG4gIGNvbnN0IGhhc05hbWVQYXJhbSA9IHVybC5zZWFyY2hQYXJhbXMuaGFzKFwibmFtZVwiKVxuICBpZiAoaGFzTmFtZVBhcmFtKSB7XG4gICAgdXJsLnNlYXJjaFBhcmFtcy5kZWxldGUoXCJuYW1lXCIpXG4gIH1cbiAgcmV0dXJuIHVybFxufVxuXG5mdW5jdGlvbiBjbGVhbkRyaWJiYmxlVXJsKHVybDogVVJMKTogVVJMIHtcbiAgY29uc3QgaGFzTmFtZVBhcmFtID0gdXJsLnNlYXJjaFBhcmFtcy5oYXMoXCJyZXNpemVcIilcbiAgaWYgKGhhc05hbWVQYXJhbSkge1xuICAgIHVybC5zZWFyY2hQYXJhbXMuZGVsZXRlKFwicmVzaXplXCIpXG4gIH1cbiAgcmV0dXJuIHVybFxufVxuIiwiaW1wb3J0IHsgZ2V0VXNlciB9IGZyb20gXCJAL3V0aWxzL2F1dGhcIjtcbmltcG9ydCB7IHBhcnNlSW1hZ2VVcmwgfSBmcm9tIFwiQC91dGlscy9pbWFnZXNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XG4gICAgYnJvd3NlclxuICAgICAgLmNvbnRleHRNZW51c1xuICAgICAgLmNyZWF0ZSh7XG4gICAgICAgIGlkOiBcInNhdmUtdG8taW1jXCIsXG4gICAgICAgIHRpdGxlOiBcItCh0L7RhdGA0LDQvdC40YLRjCDQsiBJTUNcIixcbiAgICAgICAgY29udGV4dHM6IFtcImltYWdlXCIsIFwidmlkZW9cIl0sXG4gICAgICB9KTtcbiAgfSk7XG4gIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG5cbiAgICBjb25zb2xlLmxvZyhcIlsgTUVTU0FHRSBdXCIsIG1lc3NhZ2UpXG4gICAgLy8g0J/RgNC+0LLQtdGA0Y/QtdC8INGC0LjQvyDRgdC+0L7QsdGJ0LXQvdC40Y8sINC60L7RgtC+0YDQvtC1INC/0YDQuNGB0LvQsNC7INC90LDRiCDQutC+0L3RgtC10L3Rgi3RgdC60YDQuNC/0YJcbiAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnR5cGUgPT09IFwiQVVUSF9TVUNDRVNTXCIgJiYgbWVzc2FnZS50b2tlbikge1xuXG4gICAgICAvLyDQodC+0YXRgNCw0L3Rj9C10Lwg0YLQvtC60LXQvSDQstC+INCy0L3Rg9GC0YDQtdC90L3RjtGOINCx0LXQt9C+0L/QsNGB0L3Rg9GOINC/0LDQvNGP0YLRjCDRgNCw0YHRiNC40YDQtdC90LjRj1xuICAgICAgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldCh7IGltY190b2tlbjogbWVzc2FnZS50b2tlbiB9LCAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi0KPRgNCwISDQotC+0LrQtdC9INGB0L7RhdGA0LDQvdC10L0g0LLQvdGD0YLRgNC4INGA0LDRgdGI0LjRgNC10L3QuNGPLlwiKTtcblxuICAgICAgICAvLyDQntC/0YbQuNC+0L3QsNC70YzQvdC+OiDQvtGC0L/RgNCw0LLQu9GP0LXQvCDQvtGC0LLQtdGCINC90LDQt9Cw0LQg0LrQvtC90YLQtdC90YIt0YHQutGA0LjQv9GC0YMsINC10YHQu9C4INC90YPQttC90L5cbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTsgLy8g0JTQtdGA0LbQuNC8INC60LDQvdCw0Lsg0YHQstGP0LfQuCDQvtGC0LrRgNGL0YLRi9C8INC00LvRjyDQsNGB0LjQvdGF0YDQvtC90L3QvtCz0L4g0L7RgtCy0LXRgtCwXG4gICAgfVxuICB9KTtcbiAgYnJvd3Nlci5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKFxuICAgIGFzeW5jIChpbmZvLCB0YWIpID0+IHtcbiAgICAgIGlmIChpbmZvLm1lbnVJdGVtSWQgIT09IFwic2F2ZS10by1pbWNcIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIXRhYikgcmV0dXJuO1xuXG4gICAgICBjb25zdCBpc0ltYWdlT3JWaWRlbyA9IGluZm8ubWVkaWFUeXBlID09PSBcImltYWdlXCIgfHwgaW5mby5tZWRpYVR5cGUgPT09IFwidmlkZW9cIjtcbiAgICAgIGlmICghaXNJbWFnZU9yVmlkZW8pIHJldHVybjtcblxuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh0YWIhLnVybCEpO1xuICAgICAgY29uc3QgeyBzdGF0dXMsIGRhdGE6IHVzZXIgfSA9IGF3YWl0IGdldFVzZXIoKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiWyBVU0VSIF1cIiwgdXNlcilcbiAgICAgIGlmIChzdGF0dXMgIT09IDIwMCB8fCAhdXNlcikge1xuICAgICAgICBicm93c2VyLnRhYnMuY3JlYXRlKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjUxNzMvYXV0aC9zaWduaW4/bmV4dD0ke3VybC50b1N0cmluZygpfWAsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZVRpdGxlID0gdGFiPy50aXRsZVxuXG4gICAgICBjb25zdCBzb3VyY2VVcmwgPSB1cmwudG9TdHJpbmcoKVxuXG4gICAgICBsZXQgc291cmNlRmF2aWNvbiA9IHRhYj8uZmF2SWNvblVybD8uc3RhcnRzV2l0aChcImRhdGE6XCIpID8gbnVsbCA6IHRhYj8uZmF2SWNvblVybDtcbiAgICAgIGNvbnNvbGUubG9nKFwiWyBGQVZJQ09OIF1cIiwgc291cmNlRmF2aWNvbilcbiAgICAgIGlmICghc291cmNlRmF2aWNvbiAmJiB0YWIuaWQpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnRhYnMuc2VuZE1lc3NhZ2UodGFiLmlkISwge1xuICAgICAgICAgIHR5cGU6IFwiR0VUX1NPVVJDRV9EQVRBXCIsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlsgU09VUkNFLURBVEEgXVwiLCByZXNwb25zZSk7XG4gICAgICAgIHNvdXJjZUZhdmljb24gPSByZXNwb25zZT8uZmF2aWNvbjtcbiAgICAgIH1cblxuICAgICAgLy8gY29uc3Qgc291cmNlID0ge1xuICAgICAgLy8gICB0aXRsZTogc291cmNlVGl0bGUsXG4gICAgICAvLyAgIHVybDogc291cmNlVXJsLFxuICAgICAgLy8gICBmYXZpY29uOiBzb3VyY2VGYXZpY29uLFxuICAgICAgLy8gfVxuXG5cbiAgICAgIC8vIGNvbnN0IGZpbGVuYW1lQXJyYXkgPSAobmV3IFVSTChpbmZvPy5zcmNVcmwgfHwgXCJcIikucGF0aG5hbWUpPy5zcGxpdChcIi9cIilcbiAgICAgIC8vIGNvbnN0IGZpbGVuYW1lID0gZmlsZW5hbWVBcnJheT8uW2ZpbGVuYW1lQXJyYXkubGVuZ3RoIC0gMV07XG5cbiAgICAgIC8vIGNvbnN0IGF0dGFjaG1lbnQgPSB7XG4gICAgICAvLyAgIHNyYzogaW5mbz8uc3JjVXJsLFxuICAgICAgLy8gICB0aXRsZTogYCR7c291cmNlVGl0bGV9IC0gJHtmaWxlbmFtZX1gLFxuICAgICAgLy8gICBmaWxlbmFtZSxcbiAgICAgIC8vIH1cblxuICAgICAgaWYgKGluZm8uc3JjVXJsKSB7XG5cbiAgICAgICAgY29uc3QgY2hlY2tlZFNvdXJjZSA9IGF3YWl0IGNoZWNrU291cmNlKHsgdXJsOiBzb3VyY2VVcmwgfSlcbiAgICAgICAgY29uc29sZS5sb2coXCJbIFNPVVJDRSBdXCIsIHNvdXJjZVVybClcbiAgICAgICAgY29uc29sZS5sb2coXCJbIEVYSVNUIF1cIiwgY2hlY2tlZFNvdXJjZT8uZXhpc3QpXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY2hlY2tlZFNvdXJjZVwiLCBjaGVja2VkU291cmNlLCBzb3VyY2VVcmwpXG5cbiAgICAgICAgY29uc3QgYXR0YWNobWVudFVybCA9IHBhcnNlSW1hZ2VVcmwoaW5mby5zcmNVcmwpXG4gICAgICAgIGNvbnNvbGUubG9nKFwiWyBDTEVBUkVELUFUVEFDSE1FTlQtVVJMIF1cIiwgYXR0YWNobWVudFVybClcblxuICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgZmV0Y2hBdHRhY2htZW50cyhhdHRhY2htZW50VXJsKVxuICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gYXdhaXQgdXBsb2FkQXR0YWNobWVudChibG9iKVxuICAgICAgICBpZiAoYXR0YWNobWVudCkgY29uc29sZS5sb2coXCJbIEFUVEFDSE1FTlQtVVBMT0FERUQgXVwiLCAhIWF0dGFjaG1lbnQpXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYXR0YWNobWVudFwiLCBhdHRhY2htZW50KVxuXG4gICAgICAgIGNvbnN0IGlkID0gYXR0YWNobWVudC5pZFxuXG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgIGNvbnN0IHsgc3RhdHVzOiBhdHRhY2htZW50U3RhdHVzIH0gPSBhd2FpdCBpbmJveEF0dGFjaG1lbnQoaWQpXG4gICAgICAgICAgY29uc29sZS5sb2coXCJbIElOQk9YRUQgXVwiLCBhdHRhY2htZW50U3RhdHVzID09PSAyMDEpXG4gICAgICAgICAgaWYgKGNoZWNrZWRTb3VyY2U/LmV4aXN0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlsgQ09OTkVDVCBdXCIsIGNoZWNrZWRTb3VyY2UuaWQsIGlkKVxuICAgICAgICAgICAgYXdhaXQgY29ubmVjdFNvdXJjZSh7IHNvdXJjZUlEOiBjaGVja2VkU291cmNlLmlkLCBhdHRhY2htZW50SUQ6IGlkIH0pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWyBDUkVBVEUgXVwiLCBzb3VyY2VUaXRsZSB8fCB1cmwuaG9zdG5hbWUsIGF0dGFjaG1lbnRVcmwpXG4gICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCBjcmVhdGVTb3VyY2UoeyB0aXRsZTogc291cmNlVGl0bGUgfHwgdXJsLmhvc3RuYW1lLCB1cmw6IGF0dGFjaG1lbnRVcmwsIGZhdmljb246IHNvdXJjZUZhdmljb24gfHwgdW5kZWZpbmVkLCBhdHRhY2htZW50X2lkOiBpZCB9KVxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlsgQ09OTkVDVCBdXCIsIHNvdXJjZS5pZCwgaWQpXG4gICAgICAgICAgICAgIGF3YWl0IGNvbm5lY3RTb3VyY2UoeyBzb3VyY2VJRDogc291cmNlLmlkLCBhdHRhY2htZW50SUQ6IGlkIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cblxuICAgICAgLy8gY29uc29sZS5sb2coXCJmYXZpY29uXCIsIHNvdXJjZUZhdmljb24pXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInNvdXJjZVwiLCBzb3VyY2UpXG4gICAgICAvLyBjb25zb2xlLmxvZyhhdHRhY2htZW50KTtcbiAgICB9LFxuICApO1xufSk7XG4iLCIvLyBzcmMvaW5kZXgudHNcbnZhciBfTWF0Y2hQYXR0ZXJuID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4pIHtcbiAgICBpZiAobWF0Y2hQYXR0ZXJuID09PSBcIjxhbGxfdXJscz5cIikge1xuICAgICAgdGhpcy5pc0FsbFVybHMgPSB0cnVlO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBbLi4uX01hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG4gICAgICBpZiAoZ3JvdXBzID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuICAgICAgY29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuICAgICAgdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcbiAgICAgIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG4gICAgICB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcbiAgICB9XG4gIH1cbiAgaW5jbHVkZXModXJsKSB7XG4gICAgaWYgKHRoaXMuaXNBbGxVcmxzKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuICAgIHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcbiAgICB9KTtcbiAgfVxuICBpc0h0dHBNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0h0dHBzTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RuYW1lTWF0Y2hSZWdleHMgPSBbXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLFxuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoLnJlcGxhY2UoL15cXCpcXC4vLCBcIlwiKSlcbiAgICBdO1xuICAgIGNvbnN0IHBhdGhuYW1lTWF0Y2hSZWdleCA9IHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCk7XG4gICAgcmV0dXJuICEhaG9zdG5hbWVNYXRjaFJlZ2V4cy5maW5kKChyZWdleCkgPT4gcmVnZXgudGVzdCh1cmwuaG9zdG5hbWUpKSAmJiBwYXRobmFtZU1hdGNoUmVnZXgudGVzdCh1cmwucGF0aG5hbWUpO1xuICB9XG4gIGlzRmlsZU1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmaWxlOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc0Z0cE1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzVXJuTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgY29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKTtcbiAgICBjb25zdCBzdGFyc1JlcGxhY2VkID0gZXNjYXBlZC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG4gICAgcmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG4gIH1cbiAgZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn07XG52YXIgTWF0Y2hQYXR0ZXJuID0gX01hdGNoUGF0dGVybjtcbk1hdGNoUGF0dGVybi5QUk9UT0NPTFMgPSBbXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJmaWxlXCIsIFwiZnRwXCIsIFwidXJuXCJdO1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuICB9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG4gIGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYEhvc3RuYW1lIGNhbm5vdCBpbmNsdWRlIGEgcG9ydGApO1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCIqXCIpICYmIGhvc3RuYW1lLmxlbmd0aCA+IDEgJiYgIWhvc3RuYW1lLnN0YXJ0c1dpdGgoXCIqLlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpIHtcbiAgcmV0dXJuO1xufVxuZXhwb3J0IHtcbiAgSW52YWxpZE1hdGNoUGF0dGVybixcbiAgTWF0Y2hQYXR0ZXJuXG59O1xuIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiw4XSwibWFwcGluZ3MiOiI7O0NBQ0EsU0FBUyxpQkFBaUIsS0FBSztFQUM5QixJQUFJLE9BQU8sUUFBUSxPQUFPLFFBQVEsWUFBWSxPQUFPLEVBQUUsTUFBTSxJQUFJO0VBQ2pFLE9BQU87Q0FDUjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VZQSxJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcsVUFDWCxXQUFXOzs7Q0VGZixlQUFBLFdBQUE7Ozs7Ozs7OztDQVdBO0NBRUEsZUFBQSxVQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FzQkE7OztDQ25CQSxlQUFBLGFBQUEsRUFBQSxPQUFBLEtBQUEsU0FBQSxpQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5QkE7Q0FFQSxlQUFBLFlBQUEsRUFBQSxPQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBd0JBO0NBRUEsZUFBQSxjQUFBLEVBQUEsVUFBQSxnQkFBQTs7Ozs7Ozs7Ozs7OztDQWtCQTs7O0NDdkZBLGVBQUEsaUJBQUEsS0FBQTs7Q0FJQTtDQUVBLGVBQUEsaUJBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQTtDQUVBLGVBQUEsZ0JBQUEsSUFBQTs7Ozs7Ozs7Q0FjQTs7O0NDMUNBLFNBQWdCLGNBQWMsU0FBeUI7RUFDckQsSUFBSTtHQUNGLElBQUksTUFBTSxJQUFJLElBQUksT0FBTztHQUN6QixNQUFNLFNBQVMsSUFBSTtHQUVuQixRQUFRLElBQUksY0FBYyxNQUFNO0dBRWhDLElBQUksT0FBTyxTQUFTLFdBQVcsR0FDN0IsTUFBTSxhQUFhLEdBQUc7R0FFeEIsSUFBSSxPQUFPLFNBQVMsY0FBYyxHQUNoQyxNQUFNLGlCQUFpQixHQUFHO0dBRzVCLE9BQU8sSUFBSSxTQUFTO0VBQ3RCLFFBQVE7R0FDTixPQUFPO0VBQ1Q7Q0FDRjtDQUVBLFNBQVMsYUFBYSxLQUFlO0VBRW5DLElB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