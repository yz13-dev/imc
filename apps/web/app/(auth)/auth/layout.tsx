import { ImcWithTextIcon } from "@workspace/ui/components/logo/imc"
import Link from "next/link"


type LayoutProps = {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="w-full min-h-svh pt-36 flex flex-col items-center justify-center px-6 gap-6">
      <div className="absolute max-w-24 top-6 left-6 mx-auto">
        <Link href="/">
          <ImcWithTextIcon />
        </Link>
      </div>
      {children}
    </div>
  )
}
