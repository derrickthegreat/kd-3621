import { NextRequest, NextResponse } from 'next/server'
import AccessControlService from '@/lib/db/accessControlService'
import { logUserAction } from '@/lib/db/audit'
import { prisma } from '@/lib/db/prismaUtils'

// GET /api/v1/commander/pairing
export async function GET(request: NextRequest) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request)
  if (unauthorizedResponse) return unauthorizedResponse
  try {
    const list = await prisma.commanderPairing.findMany({
      orderBy: { createdAt: 'desc' },
      include: { primary: true, secondary: true },
    })
    return NextResponse.json(list, { status: 200 })
  } catch (error: any) {
    console.error('GET /commander/pairing error:', error)
    return NextResponse.json({ message: 'Error fetching pairings', error: error.message }, { status: 500 })
  }
}

// POST /api/v1/commander/pairing
export async function POST(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({}))
    const primaryid = String(body.primaryid || '').trim()
    const secondaryid = String(body.secondaryid || '').trim()
    if (!primaryid || !secondaryid) return NextResponse.json({ message: 'Missing primaryid or secondaryid' }, { status: 400 })
    if (primaryid === secondaryid) return NextResponse.json({ message: 'Primary and secondary must differ' }, { status: 400 })

    const [primary, secondary] = await Promise.all([
      prisma.commander.findUnique({ where: { id: primaryid } }),
      prisma.commander.findUnique({ where: { id: secondaryid } }),
    ])
    if (!primary || !secondary) return NextResponse.json({ message: 'Commander not found' }, { status: 400 })

    // Optional: prevent duplicate ordered pairings
    const existing = await prisma.commanderPairing.findFirst({ where: { primaryid, secondaryid } })
    if (existing) return NextResponse.json({ message: 'Pairing already exists', id: existing.id }, { status: 200 })

  const created = await prisma.commanderPairing.create({ data: { primaryid, secondaryid, createdBy: session.userId } })
    const withIncludes = await prisma.commanderPairing.findUnique({ where: { id: created.id }, include: { primary: true, secondary: true } })
  await logUserAction({ action: `Created pairing ${withIncludes?.primary?.name ?? primaryid} + ${withIncludes?.secondary?.name ?? secondaryid}` , actorClerkId: session.userId })
    return NextResponse.json(withIncludes, { status: 200 })
  } catch (error: any) {
    console.error('POST /commander/pairing error:', error)
    return NextResponse.json({ message: 'Failed to create pairing', error: error.message }, { status: 500 })
  }
}

// DELETE /api/v1/commander/pairing?id=...
export async function DELETE(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'Missing pairing id' }, { status: 400 })

  try {
  const existing = await prisma.commanderPairing.findUnique({ where: { id }, include: { primary: true, secondary: true } })
  await prisma.commanderPairing.delete({ where: { id } })
  await logUserAction({ action: `Deleted pairing ${existing?.primary?.name ?? ''} + ${existing?.secondary?.name ?? ''}` , actorClerkId: session.userId })
    return NextResponse.json({ message: 'Deleted' }, { status: 200 })
  } catch (error: any) {
    console.error('DELETE /commander/pairing error:', error)
    return NextResponse.json({ message: 'Failed to delete pairing', error: error.message }, { status: 500 })
  }
}
