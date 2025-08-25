import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prismaUtils";
import { AccessControlService } from "@/services/AccessControlService";
import { UserRole } from "@prisma/client";

const acs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM, UserRole.KINGDOM_MEMBER]);

export async function GET(req: NextRequest) {
  const unauthorized = await acs.requireReadAccess(req);
  if (unauthorized) return unauthorized;
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  try {
    const players = await prisma.player.findMany({
      where: q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { rokId: { contains: q, mode: 'insensitive' } },
        ]
      } : undefined,
      select: { id: true, name: true, rokId: true, alliance: { select: { tag: true } } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ players })
  } catch (e) {
    console.error('/api/v1/players GET failed', e)
    return NextResponse.json({ message: 'Failed to load players' }, { status: 500 })
  }
}
