import { SidebarProvider } from "@workspace/ui/components/sidebar";
import AppSidebar from "./components/sidebar";

type LayoutProps = {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="w-full">
        {children}
      </div>
    </SidebarProvider>
  )
}
