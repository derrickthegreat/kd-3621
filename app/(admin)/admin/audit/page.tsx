import { Suspense } from 'react'
import dayjs from 'dayjs'

async function fetchRecent() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/v1/dashboard`, { cache: 'no-store' })
  if (!res.ok) return { recent: { auditLogs: [] } }
  return res.json()
}

export default async function AuditLogsPage() {
  const data = await fetchRecent()
  const items: any[] = data?.recent?.auditLogs ?? []
  return (
    <div className="p-4">
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.id} className="py-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{it.action}</span>
                <span className="text-xs text-muted-foreground">{dayjs(it.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
