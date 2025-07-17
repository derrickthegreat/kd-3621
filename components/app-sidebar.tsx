"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Frame,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Kingdom Management",
      url: "/admin/governors",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Rankings",
          url: "#",
        },
        {
          title: "DKP List",
          url: "#",
        },
        {
          title: "Applications",
          url: "#",
        },
      ],
    },
    {
      title: "Events",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Add Event",
          url: "/admin/events/add",
        },
        {
          title: "Manage Event",
          url: "#",
        },
        {
          title: "Archived Events",
          url: "#",
        },
      ],
    },
    {
      title: "User Management",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Verify User Governor",
          url: "#",
        },
        {
          title: "Lock/Unlock User Account",
          url: "#",
        },
        {
          title: "Manage Governor",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Upload Scan",
          url: "#",
        },
        {
          title: "Initiate Bot Scan",
          url: "#",
        },
        {
          title: "Edit DKP Goals",
          url: "#",
        },
      ],
    },
  ],
  botCommands: [
    {
      name: "Initiate New Kingdom Scan",
      url: "#",
      icon: Frame,
    },
    {
      name: "Initiate Fort Tracker Scan",
      url: "#",
      icon: PieChart,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/admin/"><h1 className="text-sm font-bold text-center">KD 3621</h1></Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.botCommands} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
