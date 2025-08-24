"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export function StatCard({ label, value, href, badge, badgeClassName }: { label: string; value: number | string; href?: string; badge?: number | string | boolean; badgeClassName?: string }){
  const inner = (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="text-xs uppercase text-muted-foreground">{label}</div>
          {badge ? (
            <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClassName || 'bg-primary/10 text-primary'}`}>
              {typeof badge === 'boolean' ? '•' : badge}
            </span>
          ) : null}
        </div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
  return href ? (
    <Link href={href} className="block">{inner}</Link>
  ) : inner
}
