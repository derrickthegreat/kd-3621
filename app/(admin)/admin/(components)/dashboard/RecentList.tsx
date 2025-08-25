"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

type RequestItem = {
  id: string
  createdAt: string
  user: { clerkId: string }
  player: { name: string; rokId: string }
}

type EventItem = { id: string; name: string; startDate: string }

export function RecentRequests({ items, viewAllHref = '/admin/users/verify-governor' }: { items: RequestItem[]; viewAllHref?: string }){
  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Pending Link Requests</CardTitle>
        <Link href={viewAllHref} className="text-xs text-primary underline underline-offset-2">View all</Link>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.length ? items.map((r)=> (
            <li key={r.id} className="px-4 py-3 text-sm flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate">{r.player.name} • {r.player.rokId}</div>
                <div className="text-xs text-muted-foreground">{r.user.clerkId} • {new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <Link href="/admin/users/verify-governor" className="text-xs text-primary underline underline-offset-2">Review</Link>
            </li>
          )) : (
            <li className="px-4 py-6 text-sm text-muted-foreground">No pending requests</li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}

export function UpcomingEvents({ items, viewAllHref = '/admin/events' }: { items: EventItem[]; viewAllHref?: string }){
  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Upcoming Events</CardTitle>
        <Link href={viewAllHref} className="text-xs text-primary underline underline-offset-2">View all</Link>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.length ? items.map((e)=> (
            <li key={e.id} className="px-4 py-3 text-sm flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate">{e.name}</div>
                <div className="text-xs text-muted-foreground">{new Date(e.startDate).toLocaleString()}</div>
              </div>
              <Link href={`/admin/events/${e.id}`} className="text-xs text-primary underline underline-offset-2">View</Link>
            </li>
          )) : (
            <li className="px-4 py-6 text-sm text-muted-foreground">No upcoming events</li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
