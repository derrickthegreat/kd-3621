import { NextRequest, NextResponse } from 'next/server'
import { Status } from '@prisma/client'
import AccessControlService from '@/lib/db/accessControlService'
import { prisma } from '@/lib/db/prismaUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await AccessControlService.requireReadAccess(request)
  if (unauthorized) return unauthorized
  const { id } = await params
  try {
    const app = await prisma.eventApplication.findUnique({
      where: { id },
      include: {
        player: {
          include: {
            alliance: true,
            stats: true,
            applications: {
              where: { id: { not: id } },
              include: { event: true, EventRanking: true },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        commanders: { include: { commander: true } },
        equipment: { include: { equipment: true } },
        EventRanking: true,
        Alliance: true,
    event: { include: { EventRanking: true } },
      } as any,
    })
    if (!app) return NextResponse.json({ message: 'Application not found' }, { status: 404 })
    return NextResponse.json(app, { status: 200 })
  } catch (error: any) {
    console.error('GET /api/v1/applications/[id] error:', error)
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to fetch application', error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await AccessControlService.getSessionInfo(request)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({}))
    const status = body.status as Status | undefined
    const rankInput = body.rank
    if (!status) return NextResponse.json({ message: 'Missing status' }, { status: 400 })
    if (!['NEW','REVIEWING','APPROVED','DECLINED','CLOSED'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }
    // Ensure application exists and get eventId
    const existingApp = await prisma.eventApplication.findUnique({ where: { id }, select: { id: true, eventId: true } })
    if (!existingApp) return NextResponse.json({ message: 'Application not found' }, { status: 404 })

  if (status === 'APPROVED') {
      const rank = typeof rankInput === 'string' ? parseInt(rankInput, 10) : Number(rankInput)
      if (!rank || !Number.isInteger(rank) || rank <= 0) {
        return NextResponse.json({ message: 'Rank is required and must be a positive integer when approving.' }, { status: 400 })
      }
      // Enforce uniqueness of rank per event at the application layer
      const taken = await prisma.eventRanking.findFirst({
        where: { eventId: existingApp.eventId, rank, NOT: { applicationId: id } },
        select: { id: true }
      })
      if (taken) {
        return NextResponse.json({ message: 'That rank is already assigned for this event.' }, { status: 409 })
      }
      // Upsert ranking for this application
      await prisma.eventRanking.upsert({
        where: { eventId_applicationId: { eventId: existingApp.eventId, applicationId: id } },
        update: { rank, updatedAt: new Date(), updatedBy: session.userId },
        create: { eventId: existingApp.eventId, applicationId: id, rank, createdBy: session.userId },
      })
    } else if (status === 'REVIEWING') {
      // If reviewing and a rank is provided, validate and upsert; otherwise leave as-is
      if (rankInput !== undefined && rankInput !== null && rankInput !== '') {
        const rank = typeof rankInput === 'string' ? parseInt(rankInput, 10) : Number(rankInput)
        if (!rank || !Number.isInteger(rank) || rank <= 0) {
          return NextResponse.json({ message: 'Rank must be a positive integer.' }, { status: 400 })
        }
        const taken = await prisma.eventRanking.findFirst({ where: { eventId: existingApp.eventId, rank, NOT: { applicationId: id } }, select: { id: true } })
        if (taken) return NextResponse.json({ message: 'That rank is already assigned for this event.' }, { status: 409 })
        await prisma.eventRanking.upsert({
          where: { eventId_applicationId: { eventId: existingApp.eventId, applicationId: id } },
          update: { rank, updatedAt: new Date(), updatedBy: session.userId },
          create: { eventId: existingApp.eventId, applicationId: id, rank, createdBy: session.userId },
        })
      }
    } else {
      // For NEW, DECLINED, CLOSED: remove any rank
      await prisma.eventRanking.deleteMany({ where: { eventId: existingApp.eventId, applicationId: id } })
    }

  const updated = await prisma.eventApplication.update({
      where: { id },
      data: { status, updatedAt: new Date(), updatedBy: session.userId },
      include: {
    player: { include: { alliance: true, stats: true } },
        commanders: { include: { commander: true } },
        equipment: { include: { equipment: true } },
        EventRanking: true,
        Alliance: true,
    event: { include: { EventRanking: true } },
      },
    })
    return NextResponse.json({ message: 'Status updated', application: updated }, { status: 200 })
  } catch (error: any) {
    console.error('PATCH /api/v1/applications/[id] error:', error)
    if (error.code === 'P2025') return NextResponse.json({ message: 'Application not found' }, { status: 404 })
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to update application', error: error.message }, { status: 500 })
  }
}
