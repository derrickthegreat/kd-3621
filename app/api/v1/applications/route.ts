import { NextRequest, NextResponse } from 'next/server'
import { Status } from '@prisma/client'
import AccessControlService from '@/lib/db/accessControlService'
import { prisma } from '@/lib/db/prismaUtils'

// GET /api/v1/applications?status=NEW|REVIEWING|APPROVED|DECLINED|CLOSED
// Returns all applications across events, newest first
export async function GET(request: NextRequest) {
  const unauthorized = await AccessControlService.requireReadAccess(request)
  if (unauthorized) return unauthorized
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as Status | null
    const apps = await prisma.eventApplication.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
  player: { include: { alliance: true, stats: true } },
        commanders: { include: { commander: true } },
        equipment: { include: { equipment: true } },
        EventRanking: true,
        Alliance: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(apps, { status: 200 })
  } catch (error: any) {
    console.error('GET /api/v1/applications error:', error)
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to fetch applications', error: error.message }, { status: 500 })
  }
}
