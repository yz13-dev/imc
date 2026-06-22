import SidebarTrigger from "@/app/(panel)/components/sidebar-trigger";


export default function RefHeader() {
  return (
    <header className="h-14 bg-background//90 backdrop/-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
      </div>
    </header>
  )
}
