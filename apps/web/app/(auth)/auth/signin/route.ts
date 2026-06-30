import { getAuthUrl, getSiteUrl } from "@/lib/url"



export function GET() {

  return Response.redirect(new URL(`/auth/signin?next=${getSiteUrl("/")}`, getAuthUrl("/")))
}
