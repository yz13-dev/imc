import type { Attachment } from "@/types/attachments";
import { API_URL, USE_TEST } from "@/utils/env";

export async function fetchAttachments(url: string) {
  try {
    const response = await fetch(url);
    const data = await response.blob();
    return data;
  } catch (error) {
    console.error(error)
    return null
  }
}

async function TEST__uploadAttachment(file: Blob): Promise<Attachment | null> {
  return new Promise((res, rej) => {
    const randomDesicion = Math.random() < 0.5
    if (randomDesicion) {
      res(null)
    } else {
      const attachment: Attachment = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "",
        mime_type: "",
        src: "",
        width: 0,
        height: 0,
        duration_ms: 0,
        file_size: 0,
        is_cover: false,
        blurhash: "",
        created_at: "",
        user_id: "",
        label: "",
        is_deleted: false,
      }
      res(attachment)
    }
  })
}

export async function uploadAttachment(file: Blob): Promise<Attachment | null> {
  if (USE_TEST) return TEST__uploadAttachment(file)
  try {
    const token = await getToken()

    if (!token) throw new Error("No token found");
    const formData = new FormData()

    formData.append("file", file)

    const response = await fetch(`${API_URL}/v1/my/attachments/new`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    return response.json();
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function inboxAttachment(id: string) {
  const token = await getToken()

  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/v1/my/attachments/inbox?attachmentID=${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  const status = response.status;
  return { status };
}
