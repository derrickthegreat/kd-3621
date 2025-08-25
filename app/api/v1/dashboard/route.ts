import { NextRequest, NextResponse } from 'next/server'
import access from '@/services/AccessControlService'
import { prisma } from '@/lib/db/prismaUtils'

export async function GET(req: NextRequest) {
  try {
    const unauthorized = await access.requireReadAccess(req)
    if (unauthorized) return unauthorized

    const now = new Date()
    // Helpers to gracefully handle DB unavailability (P1001) per query
    const tryQuery = async <T>(p: Promise<T>, fallback: T): Promise<{ value: T; degraded: boolean }> => {
      try {
        const value = await p
        return { value, degraded: false }
      } catch (e: any) {
        const code = e?.code || (typeof e?.message === 'string' && e.message.includes("Can't reach database server") ? 'P1001' : undefined)
        if (code === 'P1001') return { value: fallback, degraded: true }
        throw e
      }
    }

    const cUsers = await tryQuery(prisma.user.count(), 0)
    const cPlayers = await tryQuery(prisma.player.count(), 0)
    const cAlliances = await tryQuery(prisma.alliance.count(), 0)
    const cPending = await tryQuery(prisma.linkRequest.count({ where: { status: 'PENDING' } }), 0)
    const cUpcoming = await tryQuery(prisma.event.count({ where: { isArchived: false, startDate: { gte: now } } }), 0)
    const countsDegraded = cUsers.degraded || cPlayers.degraded || cAlliances.degraded || cPending.degraded || cUpcoming.degraded
    const users = cUsers.value
    const players = cPlayers.value
    const alliances = cAlliances.value
    const pendingLinkRequests = cPending.value
    const eventsUpcoming = cUpcoming.value

    const rPending = await tryQuery(
      prisma.linkRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: true, player: { include: { alliance: true } }, proofs: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      [] as any[]
    )
    const rUpcoming = await tryQuery(
      prisma.event.findMany({
        where: { isArchived: false, startDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { startDate: 'asc' },
        take: 5,
      }),
      [] as any[]
    )
    const rAudit = await tryQuery(
      prisma.userAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      [] as any[]
    )
    const recentPendingRequests = rPending.value
    const upcomingEvents = rUpcoming.value
    const recentAudit = rAudit.value
    const recentDegraded = rPending.degraded || rUpcoming.degraded || rAudit.degraded

    // Enrich audit logs with user and actor clerk IDs
    const ids = Array.from(new Set(recentAudit.flatMap(a => [a.userId, a.actorId]).filter(Boolean))) as string[]
    const lookupRes = await tryQuery(ids.length ? prisma.user.findMany({ where: { id: { in: ids } } }) : Promise.resolve([]), [] as any[])
    const lookup = lookupRes.value
    const userMap = new Map(lookup.map(u => [u.id, u]))
    const recentAuditEnriched = recentAudit.map(a => ({
      id: a.id,
      action: a.action,
      createdAt: a.createdAt,
      userId: a.userId,
      actorId: a.actorId,
      user: userMap.get(a.userId) ? { id: a.userId, clerkId: userMap.get(a.userId)!.clerkId } : null,
      actor: userMap.get(a.actorId) ? { id: a.actorId, clerkId: userMap.get(a.actorId)!.clerkId } : null,
    }))

    const dbAvailable = !(countsDegraded || recentDegraded || lookupRes.degraded)
    return NextResponse.json({
      meta: { dbAvailable },
      counts: { users, players, alliances, pendingLinkRequests, eventsUpcoming },
      recent: { pendingRequests: recentPendingRequests, upcomingEvents, auditLogs: recentAuditEnriched },
    })
  } catch (error: any) {
    console.error('GET /api/v1/dashboard error:', error)
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      // Final fallback when even guards fail
      return NextResponse.json({
        meta: { dbAvailable: false },
        counts: { users: 0, players: 0, alliances: 0, pendingLinkRequests: 0, eventsUpcoming: 0 },
        recent: { pendingRequests: [], upcomingEvents: [], auditLogs: [] },
        message: 'Database unavailable',
        hint: 'Check DATABASE_URL and database availability.',
      })
    }
    return NextResponse.json({ message: 'Failed to load dashboard', error: error?.message }, { status: 500 })
  }
}
