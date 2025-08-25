"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

const items = [
  {
    href: "/admin/settings/system",
    title: "System",
    description: "Database health, migrations, and maintenance tools.",
  },
  {
    href: "/admin/settings/integrations",
    title: "Integrations",
    description: "Discord, webhooks, and external services.",
  },
  {
    href: "/admin/settings/upload-scan",
    title: "Upload Scan",
    description: "Upload commander or scout report scans.",
  },
]

export default function SettingsPage() {
  return (
    <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="block">
            <Card className="h-full hover:bg-accent/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-lg">{i.title}</span>
                  <span className="text-sm text-muted-foreground">{i.description}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
