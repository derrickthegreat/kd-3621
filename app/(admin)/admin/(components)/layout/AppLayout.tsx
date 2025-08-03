'use client'

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ReactNode } from "react"
import { ADMIN_PANEL } from "@/lib/navigation"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar title="KD 3621" navigation={ADMIN_PANEL} />
      {children}
    </SidebarProvider>
  )
}
