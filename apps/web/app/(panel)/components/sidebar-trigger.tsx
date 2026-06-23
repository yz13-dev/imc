"use client";

import { Button } from "@workspace/ui/components/button";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { SidebarIcon } from "lucide-react";

export default function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button variant="outline" size="icon" className="backdrop-blur-xl" onClick={toggleSidebar}><SidebarIcon /></Button>
  );
}
