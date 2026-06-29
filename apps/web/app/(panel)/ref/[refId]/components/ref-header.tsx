import { HeaderContent } from "@/app/(panel)/components/header";
import BackButton from "@/app/(panel)/components/header/back-button";
import SidebarTrigger from "@/app/(panel)/components/header/sidebar-trigger";


export default function RefHeader() {
  return (
    <header className="h-14 bg-background//90 backdrop/-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between">
      <HeaderContent>
        <SidebarTrigger />
        <BackButton />
      </HeaderContent>
      <HeaderContent>
      </HeaderContent>
    </header>
  )
}
