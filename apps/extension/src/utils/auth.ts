


export async function getUser() {
  try {

    const storage = await browser.storage.local.get(['imc_token']);
    const token = storage.imc_token as string | undefined;

    if (!token) throw new Error("No token found");
    const response = await fetch("https://localhost:8080/auth/me", {
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const status = response.status;
    const isOk = status === 200;

    const data = await response.json();
    return { data: isOk ? data : null, status, error: !isOk ? data.message : null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : String(error), status: 500, data: null };
  }
}
