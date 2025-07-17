export interface SidebarItem {
  label: string
  href: string
  icon?: React.ReactNode // optional
}

export const sidebarItems: SidebarItem[] = [
  { label: "Admin Homepage", href: "/admin/" },
  { label: "Players", href: "/admin/reports" },
  { label: "Events", href: "/admin/events" },
  { label: "Users", href: "/admin/users" },
]
