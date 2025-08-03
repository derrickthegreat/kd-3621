"use client"
import * as React from "react"
import { NavUser } from "@/components/admin-panel/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { ADMIN_PANEL } from "@/lib/navigation"
import NavSection, { NavSectionProps } from "./nav-section"

const DEFAULT_NAVIGATION: NavSectionProps[] = ADMIN_PANEL;

export interface NavUserProps {
  name: string
  email: string
  avatar: string
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  title: string
  user?: NavUserProps | null,
  navigation?: NavSectionProps[]
}

export function AppSidebar({ title, user, navigation = DEFAULT_NAVIGATION, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/admin/"><h1 className="text-sm font-bold text-center">{ title }</h1></Link>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((section, id) => {
          const { sectionTitle: title, items } = section;
          return (<NavSection sectionTitle={title} items={items} key={id}/>)
        })}
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
