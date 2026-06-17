


export function getSourceData() {
  const favicon =
    document.querySelector<HTMLLinkElement>(
      'link[rel~="icon"], link[rel="shortcut icon"]',
    )?.href ?? null;
  console.log("favicon-", favicon)
  return {
    favicon
  };
}
