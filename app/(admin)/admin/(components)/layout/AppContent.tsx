'use client'
import { SidebarInset } from "@/components/ui/sidebar"
import { ReactNode } from "react"
import { AppHeader } from "./AppHeader"

interface AppContentProps {
  children: ReactNode
}

export function AppContent({ children }: AppContentProps) {

  return (
    <SidebarInset>
      <AppHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {children}
      </div>
    </SidebarInset>
  )
}
