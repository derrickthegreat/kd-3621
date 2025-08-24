import { NextRequest, NextResponse } from 'next/server'
import access from '@/services/AccessControlService'
import { prisma } from '@/lib/db/prismaUtils'

export async function GET(req: NextRequest) {
  try {
    const unauthorized = await access.requireReadAccess(req)
    if (unauthorized) return unauthorized

    const now = new Date()
    const [users, players, alliances, pendingLinkRequests, eventsUpcoming] = await Promise.all([
      prisma.user.count(),
      prisma.player.count(),
      prisma.alliance.count(),
      prisma.linkRequest.count({ where: { status: 'PENDING' } }),
      prisma.event.count({ where: { isArchived: false, startDate: { gte: now } } }),
    ])

    const [recentPendingRequests, upcomingEvents, recentAudit] = await Promise.all([
      prisma.linkRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: true, player: { include: { alliance: true } }, proofs: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.event.findMany({
        where: { isArchived: false, startDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { startDate: 'asc' },
        take: 5,
      }),
      prisma.userAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ])

    // Enrich audit logs with user and actor clerk IDs
    const ids = Array.from(new Set(recentAudit.flatMap(a => [a.userId, a.actorId]).filter(Boolean))) as string[]
    const lookup = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } } }) : []
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

    return NextResponse.json({
      counts: { users, players, alliances, pendingLinkRequests, eventsUpcoming },
  recent: { pendingRequests: recentPendingRequests, upcomingEvents, auditLogs: recentAuditEnriched },
    })
  } catch (error: any) {
    console.error('GET /api/v1/dashboard error:', error)
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to load dashboard', error: error?.message }, { status: 500 })
  }
}
