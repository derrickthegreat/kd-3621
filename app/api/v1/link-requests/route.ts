import { NextRequest, NextResponse } from "next/server"
import access, { AccessControlService } from "@/services/AccessControlService"
import { prisma } from "@/lib/db/prismaUtils"
import { logUserAction } from "@/lib/db/audit"
import { UserRole } from "@prisma/client"

const memberAccess = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM, UserRole.KINGDOM_MEMBER])

export async function GET(req: NextRequest) {
  const unauthorized = await access.requireReadAccess(req)
  if (unauthorized) return unauthorized
  const url = new URL(req.url)
  const status = url.searchParams.get('status') as any | null
  const where: any = {}
  if (status) where.status = status
  const list = await prisma.linkRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      player: { include: { alliance: true } },
      approvedBy: true,
      linkedBy: true,
      proofs: true,
    }
  })
  return NextResponse.json({ requests: list })
}

export async function POST(req: NextRequest) {
  const unauthorized = await memberAccess.requireWriteAccess(req)
  if (unauthorized) return unauthorized
  const session = await memberAccess.getSessionInfo(req)
  const userId = session?.userId
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(()=>({}))
  const { playerId, note } = body || {}
  if (!playerId) return NextResponse.json({ message: 'playerId required' }, { status: 400 })
  const created = await prisma.linkRequest.create({ data: { userId, playerId, note, createdBy: userId } })
  await logUserAction({ action: `Created link request for player ${playerId}`, actorClerkId: userId, targetUserId: created.userId })
  return NextResponse.json({ request: created })
}

export async function PUT(req: NextRequest) {
  const unauthorized2 = await access.requireWriteAccess(req)
  if (unauthorized2) return unauthorized2
  const session2 = await access.getSessionInfo(req)
  const userId2 = session2?.userId
  if (!userId2) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(()=>({}))
  const { id, action, decisionNote } = body || {}
  if (!id || !action) return NextResponse.json({ message: 'id and action required' }, { status: 400 })
  if (!['APPROVE','REJECT','CANCEL','LINK'].includes(String(action).toUpperCase())) return NextResponse.json({ message: 'Invalid action' }, { status: 400 })

  const existing = await prisma.linkRequest.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  if (action === 'APPROVE') {
    const updated = await prisma.linkRequest.update({ where: { id }, data: { status: 'APPROVED', decisionNote, approvedAt: new Date(), approvedById: userId2, updatedBy: userId2 } })
  await logUserAction({ action: `Approved link request (${id})`, actorClerkId: userId2, targetUserId: updated.userId })
    return NextResponse.json({ request: updated })
  }
  if (action === 'REJECT') {
    const updated = await prisma.linkRequest.update({ where: { id }, data: { status: 'REJECTED', decisionNote, updatedBy: userId2 } })
  await logUserAction({ action: `Rejected link request (${id})`, actorClerkId: userId2, targetUserId: updated.userId })
    return NextResponse.json({ request: updated })
  }
  if (action === 'CANCEL') {
    const updated = await prisma.linkRequest.update({ where: { id }, data: { status: 'CANCELED', updatedBy: userId2 } })
  await logUserAction({ action: `Canceled link request (${id})`, actorClerkId: userId2, targetUserId: updated.userId })
    return NextResponse.json({ request: updated })
  }
  if (action === 'LINK') {
    // upon link, create users_players if not exists and stamp linkedBy
    const lr = await prisma.linkRequest.findUnique({ where: { id } })
    if (!lr) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    await prisma.userPlayer.upsert({
      where: { userId_playerId: { userId: lr.userId, playerId: lr.playerId } },
      create: { userId: lr.userId, playerId: lr.playerId },
      update: {},
    })
    const updated = await prisma.linkRequest.update({ where: { id }, data: { linkedAt: new Date(), linkedById: userId2, updatedBy: userId2 } })
  await logUserAction({ action: `Linked user to player (${lr.userId} -> ${lr.playerId})`, actorClerkId: userId2, targetUserId: lr.userId })
    return NextResponse.json({ request: updated })
  }
  return NextResponse.json({ message: 'No-op' })
}
