import { NavSectionProps } from "@/components/admin-panel/nav-section";
import { SquareTerminal, Bot, BookOpen, Settings2, Frame, PieChart, SearchIcon } from "lucide-react";

export const ADMIN_PANEL: NavSectionProps[] = [
  {
    sectionTitle: 'Menu',
    items: [
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
      url: "/admin/events",
      icon: Bot,
      items: [
        {
          title: "View All Events",
          url: "/admin/events/",
        },
        {
          title: "Add Event",
          url: "/admin/events/add",
        },
        {
          title: "Archived Events",
          url: "/admin/events/archived",
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
          url: "/admin/users/verify-governor",
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
          url: "/admin/settings/upload-scan"
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
  },
  {
    sectionTitle: 'Bot Commands',
    items: [
    {
      title: "Find a Player",
      url: "#",
      icon: SearchIcon,
    },
    {
      title: "Initiate Kingdom Scan",
      url: "#",
      icon: Frame,
    },
    {
      title: "Initiate Fort Tracker Scan",
      url: "#",
      icon: PieChart,
    },
  ],
  }
]