"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { ROUTE_PAGE_META, ROUTE_TITLE_MAP } from "@/lib/routeTitles"
import { useEntityTitle } from "./useEntityTitle"

export function PageHeading() {
  const pathname = usePathname()
  const { title: entityTitle, description: entityDescription } = useEntityTitle()

  const { title, description } = useMemo(() => {
    const segs = pathname?.split("/").filter(Boolean) ?? []
    // Drop known wrappers
    const coreSegs = segs.filter((s) => s !== "app" && s !== "(admin)" && s !== "admin")

    // Prefer the last segment that has page meta; otherwise fall back to previous static segment
    let metaKey: string | undefined
    for (let i = coreSegs.length - 1; i >= 0; i--) {
      const s = coreSegs[i]
      if (ROUTE_PAGE_META[s]) {
        metaKey = s
        break
      }
    }

    // Fallback: use previous static segment if last is an id-like or unknown
    if (!metaKey && coreSegs.length > 0) {
      const last = coreSegs[coreSegs.length - 1]
      const prev = coreSegs[coreSegs.length - 2]
      if (prev && ROUTE_PAGE_META[prev]) metaKey = prev
      else metaKey = last
    }

    const meta = (metaKey && ROUTE_PAGE_META[metaKey]) || undefined
    const prettyFromKey = (key?: string) =>
      key ? ROUTE_TITLE_MAP[key] || key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Admin"

  const title = entityTitle || meta?.title || prettyFromKey(metaKey)
  // If we resolved an entity title, prefer its description and do NOT fall back to generic route description
  const cleanedEntityDesc = typeof entityDescription === "string" ? entityDescription.trim() : entityDescription
  const description = entityTitle ? (cleanedEntityDesc || null) : (meta?.description)
  return { title, description }
  }, [pathname, entityTitle, entityDescription])

  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description ? (
        <p className="text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
