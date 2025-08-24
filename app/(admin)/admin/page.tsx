'use client'

import { useAuth, SignIn, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { StatCard } from './(components)/dashboard/StatCard'
import { RecentRequests, UpcomingEvents } from './(components)/dashboard/RecentList'
import { QuickActions } from './(components)/dashboard/QuickActions'
import { Activity } from './(components)/dashboard/Activity'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardData = {
        counts: { users: number; players: number; alliances: number; pendingLinkRequests: number; eventsUpcoming: number }
        recent: { pendingRequests: any[]; upcomingEvents: any[]; auditLogs: any[] }
}

export default function AdminPage() {
    const { userId, getToken } = useAuth()
    const { user } = useUser()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            if (!userId) return
            try {
                const token = await getToken()
                const res = await fetch('/api/v1/dashboard', { headers: { Authorization: `Bearer ${token}` } })
                const body = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(body?.message || 'Failed to load dashboard')
                setData(body)
            } catch (e: any) {
                setError(e.message || 'Failed to load')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [userId])

    if (!userId) return <SignIn path="/admin" routing="path" />

    return (
        <>
            <div className="w-full px-4 md:px-6 lg:px-8 space-y-4">
                {/* Welcome banner */}
                <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                    <span>Welcome{user?.firstName ? `, ${user.firstName}` : ''}! </span>
                    <span className="text-muted-foreground">Here’s a quick overview and recent activity.</span>
                </div>
                {loading ? (
                    <div className="space-y-4">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                        </div>
                        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                            <Skeleton className="h-64" />
                            <Skeleton className="h-64" />
                        </div>
                    </div>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : data ? (
                    <>
                                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                                                    <StatCard label="Users" value={data.counts.users} href="/admin/users" />
                                                    <StatCard label="Players" value={data.counts.players} href="/admin/players" />
                                                    <StatCard label="Alliances" value={data.counts.alliances} href="/admin/alliances" />
                                                    <StatCard label="Pending Links" value={data.counts.pendingLinkRequests} href="/admin/users/verify-governor" badge={data.counts.pendingLinkRequests > 0 && data.counts.pendingLinkRequests} badgeClassName={data.counts.pendingLinkRequests>0? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300' : undefined} />
                                                    <StatCard label="Upcoming Events" value={data.counts.eventsUpcoming} href="/admin/events" />
                                                </div>
                                                            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                                                                <div className="lg:col-span-2 space-y-4">
                                                                    <RecentRequests items={data.recent.pendingRequests} />
                                                                    <UpcomingEvents items={data.recent.upcomingEvents} />
                                                                    <Activity items={data.recent.auditLogs as any[]} />
                                                                </div>
                                                                <div className="flex flex-col gap-4">
                                                                    <QuickActions />
                                                                </div>
                                                            </div>
                    </>
                ) : null}
            </div>
        </>
    )
}

