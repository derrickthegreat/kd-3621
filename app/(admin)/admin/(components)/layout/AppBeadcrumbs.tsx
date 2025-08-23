"use client"

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'

export interface BreadcrumbItemType {
  title: string
  href?: string
}

interface AppBreadcrumbsProps {
  items?: BreadcrumbItemType[]
  titleMap?: Record<string, string>
  lastTitleOverride?: string
}

function prettifySegment(seg: string): string {
  if (!seg) return ''
  // If it's a UUID-like/ID segment, keep as-is or label succinctly
  const isIdLike = /^(?:[0-9a-fA-F-]{16,}|\d+)$/.test(seg)
  if (isIdLike) return `#${seg}`
  // Replace dashes/underscores with spaces and capitalize words
  return seg
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AppBreadcrumbs({ items, titleMap, lastTitleOverride }: AppBreadcrumbsProps) {
  const pathname = usePathname()

  const computedItems = useMemo(() => {
    if (items && items.length) return items
    if (!pathname) return []

    const segments = pathname.split('/').filter(Boolean)
    const crumbs: BreadcrumbItemType[] = []
    let acc = ''

    segments.forEach((seg, idx) => {
      acc += `/${seg}`
      const mapped = titleMap?.[seg]
      const title = mapped ?? prettifySegment(seg)
      crumbs.push({ title, href: idx < segments.length - 1 ? acc : undefined })
    })
    return crumbs
  }, [items, pathname, titleMap])

  if (!computedItems.length) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {computedItems.map((item, index) => {
          const isLast = index === computedItems.length - 1
          const title = isLast && lastTitleOverride ? lastTitleOverride : item.title
          return (
          <BreadcrumbItem
            key={`${item.title}-${index}`}
            className={""}
          >
            {item.href && index < computedItems.length - 1 ? (
              <div className='flex items-center gap-2'>
                <BreadcrumbLink asChild><Link href={item.href}>{title}</Link></BreadcrumbLink>
                <BreadcrumbSeparator className="hidden md:block" />
              </div>
            ) : (
              <BreadcrumbPage>{title}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        )})}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
