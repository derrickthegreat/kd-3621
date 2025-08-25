import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import AccessControlService from '@/lib/db/accessControlService'
import { logUserAction } from '@/lib/db/audit'
import { prisma } from '@/lib/db/prismaUtils'
const HAS_SKILLTREE_REL = !!(Prisma as any)?.dmmf?.datamodel?.models?.some(
  (m: any) => m.name === 'CommanderSkillTree' && m.fields?.some((f: any) => f.name === 'commanderId')
)

// GET /api/v1/commander/skill-tree
export async function GET(request: NextRequest) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request)
  if (unauthorizedResponse) return unauthorizedResponse
  const { searchParams } = new URL(request.url)
  const commanderId = searchParams.get('commanderId')
  try {
    if (!HAS_SKILLTREE_REL) {
      return NextResponse.json(
        { message: 'CommanderSkillTree relation not available yet. Please run database migrations.' },
        { status: 501 }
      )
    }
    const list = await (prisma as any).commanderSkillTree.findMany({
      where: commanderId ? { commanderId } : undefined,
      orderBy: [{ commanderId: 'asc' }, { name: 'asc' }],
      include: { commander: true },
    })
    return NextResponse.json(list, { status: 200 })
  } catch (error: any) {
    console.error('GET /commander/skill-tree error:', error)
    return NextResponse.json({ message: 'Error fetching skill trees', error: error.message }, { status: 500 })
  }
}

// POST /api/v1/commander/skill-tree
// Body: { commanderId: string, name: string, url: string, rating?: number, description?: string }
export async function POST(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({}))
    const commanderId = String(body.commanderId || '').trim()
    const name = String(body.name || '').trim()
    const url = String(body.url || '').trim()
    const rating = body.rating == null ? undefined : Number(body.rating)
    const description = typeof body.description === 'string' ? body.description.trim() : undefined

    if (!HAS_SKILLTREE_REL) {
      return NextResponse.json(
        { message: 'CommanderSkillTree relation not available yet. Please run database migrations.' },
        { status: 501 }
      )
    }

    if (!commanderId || !name || !url) return NextResponse.json({ message: 'Missing commanderId, name, or url' }, { status: 400 })

    const commander = await prisma.commander.findUnique({ where: { id: commanderId } })
    if (!commander) return NextResponse.json({ message: 'Commander not found' }, { status: 400 })

    // Upsert by (commanderId, name)
    const existing = await (prisma as any).commanderSkillTree.findFirst({ where: { commanderId, name: { equals: name, mode: 'insensitive' } } })
    let saved
    if (existing) {
      saved = await (prisma as any).commanderSkillTree.update({ where: { id: existing.id }, data: { url, description, rating, updatedBy: session.userId } })
    } else {
      saved = await (prisma as any).commanderSkillTree.create({ data: { commanderId, name, url, description, rating, createdBy: session.userId } })
    }

  const withCommander = await (prisma as any).commanderSkillTree.findUnique({ where: { id: saved.id }, include: { commander: true } })
  await logUserAction({ action: `${existing ? 'Updated' : 'Created'} skill tree ${name} for commander ${commander.name}`, actorClerkId: session.userId })
    return NextResponse.json(withCommander, { status: 200 })
  } catch (error: any) {
    console.error('POST /commander/skill-tree error:', error)
    return NextResponse.json({ message: 'Failed to save skill tree', error: error.message }, { status: 500 })
  }
}

// PUT /api/v1/commander/skill-tree
// Body: { id: string, name?: string, url?: string, rating?: number, description?: string }
export async function PUT(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || '').trim()
    if (!HAS_SKILLTREE_REL) {
      return NextResponse.json(
        { message: 'CommanderSkillTree relation not available yet. Please run database migrations.' },
        { status: 501 }
      )
    }
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 })

    const existing = await (prisma as any).commanderSkillTree.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const data: any = {}
    if (typeof body.name === 'string') data.name = String(body.name).trim()
    if (typeof body.url === 'string') data.url = String(body.url).trim()
    if (body.rating === null || body.rating === undefined || Number.isNaN(Number(body.rating))) {
      // leave as is if not provided; if explicitly null, set null
      if (body.rating === null) data.rating = null
    } else {
      data.rating = Number(body.rating)
    }
    if (typeof body.description === 'string') data.description = String(body.description).trim()

    // If name changed, enforce unique(commanderId, name)
    if (data.name && data.name.toLowerCase() !== String(existing.name).toLowerCase()) {
      const dup = await (prisma as any).commanderSkillTree.findFirst({
        where: { commanderId: existing.commanderId, name: { equals: data.name, mode: 'insensitive' }, NOT: { id } },
      })
      if (dup) return NextResponse.json({ message: 'A skill tree with this name already exists for the commander.' }, { status: 409 })
    }

  const updated = await (prisma as any).commanderSkillTree.update({ where: { id }, data: { ...data, updatedBy: session.userId } })
    const withCommander = await (prisma as any).commanderSkillTree.findUnique({ where: { id: updated.id }, include: { commander: true } })
  await logUserAction({ action: `Updated skill tree ${withCommander.name} for commander ${withCommander.commander?.name ?? ''}`, actorClerkId: session.userId })
    return NextResponse.json(withCommander, { status: 200 })
  } catch (error: any) {
    console.error('PUT /commander/skill-tree error:', error)
    return NextResponse.json({ message: 'Failed to update skill tree', error: error.message }, { status: 500 })
  }
}

// DELETE /api/v1/commander/skill-tree?id=...
export async function DELETE(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 })
  try {
    if (!HAS_SKILLTREE_REL) {
      return NextResponse.json(
        { message: 'CommanderSkillTree relation not available yet. Please run database migrations.' },
        { status: 501 }
      )
    }
  const existing = await (prisma as any).commanderSkillTree.findUnique({ where: { id }, include: { commander: true } })
  await (prisma as any).commanderSkillTree.delete({ where: { id } })
  await logUserAction({ action: `Deleted skill tree ${existing?.name ?? id} for commander ${existing?.commander?.name ?? ''}`, actorClerkId: session.userId })
    return NextResponse.json({ message: 'Deleted' }, { status: 200 })
  } catch (error: any) {
    console.error('DELETE /commander/skill-tree error:', error)
    return NextResponse.json({ message: 'Failed to delete skill tree', error: error.message }, { status: 500 })
  }
}
