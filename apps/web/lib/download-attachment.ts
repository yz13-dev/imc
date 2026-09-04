import { getAssetsProxyUrl } from "@/lib/url"

export async function downloadAttachment(id: string, filename = "attachment") {
  try {
    const response = await fetch(getAssetsProxyUrl(`/${id}`))

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`)
    }

    const blobUrl = URL.createObjectURL(await response.blob())
    const link = document.createElement("a")

    link.href = blobUrl
    link.download = filename || "attachment"
    link.click()

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
  } catch (error) {
    console.error(error)
  }
}
