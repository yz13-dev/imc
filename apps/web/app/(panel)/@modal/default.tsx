import Page from "./(.)[id]/page";

export default function Default() {
  return null;

  const params = (): Promise<{ id: string }> => new Promise((resolve) => resolve({ id: "dd473c00-0f95-419a-ad94-b53180634478" }))
  return <Page params={params()} />
}
