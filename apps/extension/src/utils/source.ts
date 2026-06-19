


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




export async function createSource({ title, url, favicon, attachment_id }: { title: string; url: string, favicon?: string, attachment_id?: string }) {
  const urlInstance = new URL(url)
  const domain = urlInstance.hostname;
  const slug = urlInstance.pathname;
  try {
    const token = await getToken()

    if (!token) throw new Error("No token found");

    const response = await fetch("https://localhost:8080/v1/source/new", {
      method: "POST",
      body: JSON.stringify({ name: title, domain, slug, favicon_url: favicon, attachment_id }),
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });

    return response.json();

  } catch (error) {
    console.log(error)
    return null
  }
}

export async function checkSource({ url }: { url: string }): Promise<{ id: string, exist: boolean } | null> {

  const urlInstance = new URL(url)
  const domain = urlInstance.hostname;
  const slug = urlInstance.pathname;

  const token = await getToken()
  if (!token) return null

  try {
    const response = await fetch(`https://localhost:8080/v1/source/check?domain=${domain}&slug=${slug}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });

    return response.json()
  } catch (error) {
    console.log(error)
    return null
  }
}

export async function connectSource({ sourceID, attachmentID }: { sourceID: string; attachmentID: string }) {
  const token = await getToken()
  if (!token) return null

  try {
    const response = await fetch(`https://localhost:8080/v1/source/${sourceID}/connect?attachmentID=${attachmentID}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`,
      }
    });

    return response.json()
  } catch (error) {
    console.log(error)
    return null
  }
}
