import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import AccessControlService from '@/lib/db/accessControlService';
import { prepareCreateOrUpdate } from '@/lib/db/prismaUtils';

/**
 * API Endpoint: /api/alliance
 *
 * Methods:
 *  - GET: List all alliances or fetch one by 'id' or 'tag', with optional includes.
 *    Optional query params:
 *      - id: string
 *      - tag: string
 *      - players: "true" | "false"
 *      - stats: "true" | "false"
 *      - applications: "true" | "false"
 *
 *    Default: When fetching a single alliance, the latest stat is included even if stats=false.
 *
 *    Example GET requests:
 *      GET /api/alliance
 *      GET /api/alliance?id=uuid123
 *      GET /api/alliance?tag=TAG123
 *      GET /api/alliance?id=uuid123&players=true&stats=true&applications=true
 *
 *  - POST: Create or update one or many alliances.
 *    Required fields per alliance: tag, name
 *    Optional: id
 *
 *    Example POST request payloads:
 *
 *    // Create one
 *    {
 *      "tag": "TAG123",
 *      "name": "Alliance Name"
 *    }
 *
 *    // Bulk create or update
 *    [
 *      { "tag": "TAG123", "name": "Alliance One" },
 *      { "id": "uuid456", "tag": "NEWTAG", "name": "Updated Alliance" }
 *    ]
 */

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request);
  
  if (unauthorizedResponse) return unauthorizedResponse;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const tag = searchParams.get('tag');
  const includePlayers = searchParams.get('players') === 'true';
  const includeStats = searchParams.get('stats') === 'true';
  const includeApplications = searchParams.get('applications') === 'true';

  try {
    if (id || tag) {
      const alliance = await prisma.alliance.findUnique({
        where: id ? { id } : { tag: tag! },
        include: {
          players: includePlayers,
          applications: includeApplications,
          stats: includeStats
            ? { orderBy: { snapshot: 'desc' } }
            : false,
          _count: { select: { players: true } },
        },
      });

      if (!alliance) {
        return NextResponse.json({ message: 'Alliance not found' }, { status: 404 });
      }

      if (!includeStats) {
        const latestStat = await prisma.allianceStats.findFirst({
          where: { allianceId: alliance.id },
          orderBy: { snapshot: 'desc' },
        });

        return NextResponse.json({ ...alliance, latestStat }, { status: 200 });
      }

      return NextResponse.json(alliance, { status: 200 });
    }

    const alliances = await prisma.alliance.findMany({
      include: {
        players: includePlayers,
        stats: includeStats,
        applications: includeApplications,
        _count: {
          select: {
            players: true,
            stats: true,
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alliances, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/alliance error:', error);
    return NextResponse.json({ message: 'Failed to fetch alliance(s)', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request);
  if(!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if(!AccessControlService.canWrite(session.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const alliances = Array.isArray(body) ? body : [body];
    const results = [];

    for (const alliance of alliances) {
      const { id, tag, name } = alliance;

      if (!tag || !name) {
        return NextResponse.json({ message: 'Missing required fields: tag, name' }, { status: 400 });
      }

      const payload = { id, tag, name };

      const result = await prepareCreateOrUpdate(prisma.alliance, payload, {
        userId: session.userId,
        idField: 'id',
        matchField: 'tag',
      });

      results.push(result);
    }

    return NextResponse.json(
      {
        message:
          results.length === 1
            ? (body.id || results[0]?.id ? 'Alliance updated' : 'Alliance created')
            : `${results.length} alliances processed`,
        alliance: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/alliance error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Alliance tag must be unique' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create/update alliance(s)', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}