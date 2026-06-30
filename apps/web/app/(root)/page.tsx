import Component from "@/app/home/page"
import { getMe } from "@/lib/me"
import { redirect } from "next/navigation"


export default async function Page() {
  const user = await getMe()
  console.log("[USER]", user)
  if (user) return redirect("/inbox")
  return <Component />
}
