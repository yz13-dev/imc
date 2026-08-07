

type ParseImageUrlOptions = {
  url: string
  base: string
}
// Эта функция нужна чтобы чистить ссылки от форматирований картинок, по типа name=360x360
export function parseImageUrl(options: ParseImageUrlOptions): string {
  const isRelative = options.url.startsWith("/")
  try {
    let url = new URL(options.url, isRelative ? options.base : undefined)

    if (url.pathname.startsWith("/_next")) {
      url = cleanNextAppUrl(url, options.base)
    }
    const domain = url.hostname
    if (domain.endsWith("twimg.com")) {
      url = cleanXcomUrl(url)
    }
    if (domain.endsWith("dribbble.com")) {
      url = cleanDribbbleUrl(url)
    }

    return url.toString();
  } catch {
    if (!isRelative) return options.url
    try {
      return new URL(options.url, options.base).toString()
    } catch {
      return options.url
    }
  }
}

function cleanNextAppUrl(url: URL, base: string): URL {
  const hasUrlParam = url.searchParams.has("url")
  if (hasUrlParam) {
    const path = url.searchParams.get("url")
    if (!path) return url
    return new URL(path, base)
  }
  return url
}

function cleanXcomUrl(url: URL): URL {
  const hasNameParam = url.searchParams.has("name")
  if (hasNameParam) {
    url.searchParams.delete("name")
  }
  return url
}

function cleanDribbbleUrl(url: URL): URL {
  const hasNameParam = url.searchParams.has("resize")
  if (hasNameParam) {
    url.searchParams.delete("resize")
  }
  return url
}
