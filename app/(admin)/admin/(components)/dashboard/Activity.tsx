"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AuditItem = {
  id: string
  action: string
  createdAt: string
  user?: { id: string; clerkId: string } | null
  actor?: { id: string; clerkId: string } | null
}

export function Activity({ items }: { items: AuditItem[] }){
  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items?.length ? items.map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate">{a.action}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {(a.actor?.clerkId || 'system')} → {(a.user?.clerkId || 'user')} • {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </li>
          )) : (
            <li className="px-4 py-6 text-sm text-muted-foreground">No recent activity</li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
