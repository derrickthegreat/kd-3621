"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, UserCheck, UsersRound, Calendar, ArrowUpRight } from "lucide-react"

const links: Array<{ label: string; href: string; icon: any; desc?: string }> = [
  { label: 'Manage Users', href: '/admin/users', icon: Users, desc: 'Roles, status, sessions' },
  { label: 'Verify & Link', href: '/admin/users/verify-governor', icon: UserCheck, desc: 'Approve and link governors' },
  { label: 'Players', href: '/admin/players', icon: UsersRound, desc: 'Roster and profiles' },
  { label: 'Events', href: '/admin/events', icon: Calendar, desc: 'Schedule and manage' },
]

export function QuickActions(){
  return (
  <Card className="self-start w-full">
      <CardHeader className="py-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
      <CardContent className="p-0">
        <ul>
          {links.map((l) => {
            const Icon = l.icon
            return (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-none">{l.label}</div>
                      {l.desc ? <div className="text-xs text-muted-foreground truncate">{l.desc}</div> : null}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
