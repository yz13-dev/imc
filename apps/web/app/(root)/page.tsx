import Component from "@/app/home/page"
import { getMe } from "@/lib/me"
import { redirect } from "next/navigation"


export default async function Page() {
  const user = await getMe()
  if (user) return redirect("/dashboard")
  return <Component />
}
