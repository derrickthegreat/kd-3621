import { NavSectionProps } from "@/components/admin-panel/nav-section";
import { LayoutDashboard, Users, Calendar, Swords, BarChart3, Settings, Search as SearchIcon, ShieldCheck, Activity } from "lucide-react";

export const ADMIN_PANEL: NavSectionProps[] = [
  {
    sectionTitle: "Admin",
    items: [
      {
        title: "Overview",
        url: "/admin",
        icon: LayoutDashboard,
        isActive: true,
        items: [
          { title: "Dashboard", url: "/admin" },
        ],
      },
      {
        title: "Roster",
        url: "/admin/players",
        icon: Users,
        items: [
          { title: "Players", url: "/admin/players" },
          { title: "Alliances", url: "/admin/alliances" },
        ],
      },
      {
        title: "Recruitment & Events",
        url: "/admin/events",
        icon: Calendar,
        items: [
          { title: "All Events", url: "/admin/events" },
          { title: "Applications", url: "/admin/applications" },
          { title: "Archived", url: "/admin/events/archived" },
        ],
      },
      {
        title: "Military Assets",
        url: "/admin/commanders",
        icon: Swords,
        items: [
          { title: "Commanders", url: "/admin/commanders" },
          { title: "Pairings", url: "/admin/commanders/pairings" },
          { title: "Skill Trees", url: "/admin/commanders/skill-trees" },
          { title: "Equipment", url: "/admin/equipment" },
          { title: "Attributes", url: "/admin/equipment/attributes" },
          { title: "Materials", url: "/admin/equipment/materials" },
        ],
      },
      {
        title: "Data & Analytics",
        url: "/admin/snapshots",
        icon: BarChart3,
        items: [
          { title: "Snapshots", url: "/admin/snapshots" },
          { title: "Imports", url: "/admin/data/imports" },
          { title: "Exports", url: "/admin/data/exports" },
        ],
      },
      {
        title: "Users & Access",
        url: "/admin/users",
        icon: ShieldCheck,
        items: [
          { title: "Users", url: "/admin/users" },
          { title: "Verify & Link", url: "/admin/users/verify-governor" },
          { title: "Audit Logs", url: "/admin/audit" },
        ],
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
        items: [
          { title: "General", url: "/admin/settings" },
          { title: "Integrations", url: "/admin/settings/integrations" },
          { title: "System", url: "/admin/settings/system" },
          { title: "Upload Scan", url: "/admin/settings/upload-scan" },
        ],
      },
    ],
  },
  {
    sectionTitle: "Tools",
    items: [
      {
        title: "Global Search",
        url: "#",
        icon: SearchIcon,
        items: [
          { title: "Find Player", url: "#" },
          { title: "Find Alliance", url: "#" },
        ],
      },
      {
        title: "Maintenance",
        url: "#",
        icon: Activity,
        items: [
          { title: "Data Repair", url: "#" },
          { title: "Reindex", url: "#" },
        ],
      },
    ],
  },
];