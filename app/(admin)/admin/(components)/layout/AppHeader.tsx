"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AppBreadcrumbs } from "./AppBeadcrumbs"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { ROUTE_TITLE_MAP } from "@/lib/routeTitles"
import { useEntityTitle } from "./useEntityTitle"
import { PageHeading } from "./PageHeading"
import { useHeaderActionsContext } from "./HeaderActions"

interface AppHeaderProps {
  titleOverride?: string
}

export function AppHeader({ titleOverride }: AppHeaderProps) {
  const pathname = usePathname()
  const { title: entityTitle } = useEntityTitle()
  const { actions } = useHeaderActionsContext()
  const title = useMemo(() => {
    if (titleOverride) return titleOverride
    const segs = pathname?.split("/").filter(Boolean) ?? []
    const last = segs[segs.length - 1] ?? ""
    const pretty = ROUTE_TITLE_MAP[last] || last.replace(/[-_]+/g, c => c.toUpperCase())
    // Special-case the admin root so the page heading reads Admin Dashboard
    const isAdminRoot = segs.join("/") === "app/(admin)/admin" || (segs.length === 2 && segs[0] === "admin")
    if (isAdminRoot) return "Admin Dashboard"
    return entityTitle || pretty || "Admin"
  }, [pathname, titleOverride, entityTitle])

  return (
    <header className="flex flex-col gap-2 px-0">
      <div className="flex h-12 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <div>
          <AppBreadcrumbs titleMap={ROUTE_TITLE_MAP} lastTitleOverride={entityTitle ?? undefined} />
        </div>
      </div>
      <div className="flex items-start justify-between px-4">
        <PageHeading />
        {actions ? (
          <div className="pt-4 flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}