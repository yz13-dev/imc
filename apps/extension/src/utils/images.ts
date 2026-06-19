


// Эта функция нужна чтобы чистить ссылки от форматирований картинок, по типа name=360x360
export function parseImageUrl(baseUrl: string): string {
  try {
    let url = new URL(baseUrl)
    const domain = url.hostname

    console.log("[ DOMAIN ]", domain)

    if (domain.endsWith("twimg.com")) {
      url = cleanXcomUrl(url)
    }
    if (domain.endsWith("dribbble.com")) {
      url = cleanDribbbleUrl(url)
    }

    return url.toString()
  } catch {
    return baseUrl
  }
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
