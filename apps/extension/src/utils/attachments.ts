
export async function fetchAttachments(url: string) {
  const response = await fetch(url);
  const data = await response.blob();
  return data;
}

export async function uploadAttachment(file: Blob) {
  try {

    const token = await getToken()

    if (!token) throw new Error("No token found");
    const formData = new FormData()

    formData.append("file", file)

    const response = await fetch("https://localhost:8080/v1/my/attachments/new", {
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

  const response = await fetch(`https://localhost:8080/v1/my/attachments/inbox?attachmentID=${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  const status = response.status;
  return { status };
}
