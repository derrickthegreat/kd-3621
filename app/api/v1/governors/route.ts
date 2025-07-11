import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSessionInfo, canRead, canWrite } from '@/lib/accessControlService';
import { prepareCreateOrUpdate } from '@/lib/prismaUtils';

const prisma = new PrismaClient();

/**
 * API Endpoint: /api/governor
 *
 * Methods:
 *  - GET: List all governors or fetch one by 'id' or 'rokId', with optional includes.
 *    Default behavior includes player stats.
 *    Optional query params:
 *      - id: string (fetch a specific governor by unique id)
 *      - rokId: string (fetch a specific governor by Rise of Kingdoms ID)
 *      - equipment: "true" | "false" (include player's equipment)
 *      - commanders: "true" | "false" (include player's commanders)
 *
 *    Example GET requests:
 *      GET /api/governor                 => List all governors with stats
 *      GET /api/governor?id=uuid123     => Get governor by ID with stats
 *      GET /api/governor?rokId=rok456   => Get governor by rokId with stats
 *      GET /api/governor?rokId=rok456&equipment=true&commanders=true
 *                                       => Get governor with equipment and commanders
 *
 *  - POST: Create or update one or many governors.
 *    Required fields per governor: rokId (unique), name
 *    Optional: id (to update by id), allianceId
 *
 *    Example POST request payloads:
 *
 *    // Single create
 *    {
 *      "rokId": "rok123",
 *      "name": "GovernorName",
 *      "allianceId": "alliance-uuid"
 *    }
 *
 *    // Multiple create or update
 *    [
 *      {
 *        "rokId": "rok123",
 *        "name": "Governor One",
 *        "allianceId": "alliance-uuid"
 *      },
 *      {
 *        "id": "uuid456",
 *        "rokId": "rok456",
 *        "name": "Updated Governor",
 *        "allianceId": "new-alliance-uuid"
 *      }
 *    ]
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const rokId = searchParams.get('rokId');
  const includeEquipment = searchParams.get('equipment') === 'true';
  const includeCommanders = searchParams.get('commanders') === 'true';

  const session = await getSessionInfo();
  const isPrivileged = session && canRead(session.role); // admin or system

  const sanitizePlayer = (player: any) => {
    if (!isPrivileged) {
      delete player.userId;
      delete player.userIdVerified;
      delete player.dateMigrated;
      delete player.dateMigratedOut;
      delete player.equipment;
      delete player.commanders;
    }
    return player;
  };

  try {
    if (id || rokId) {
      const player = await prisma.player.findUnique({
        where: id ? { id } : { rokId: rokId! },
        include: {
          stats: true,
          equipment: includeEquipment ? { include: { equipment: true } } : false,
          commanders: includeCommanders ? { include: { commander: true } } : false,
        },
      });

      if (!player) {
        return NextResponse.json({ message: 'Governor not found' }, { status: 404 });
      }

      return NextResponse.json(sanitizePlayer(player), { status: 200 });
    }

    const players = await prisma.player.findMany({
      include: {
        stats: true,
        _count: {
          select: {
            equipment: true,
            commanders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitizedPlayers = players.map(sanitizePlayer);
    return NextResponse.json(sanitizedPlayers, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/governor error:', error);
    return NextResponse.json({ message: 'Error fetching governors', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionInfo();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!canWrite(session.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const governors = Array.isArray(body) ? body : [body];

    const results = [];

    for (const governor of governors) {
      const { id, rokId, name, allianceId } = governor;

      if (!rokId || !name) {
        return NextResponse.json({ message: 'Missing required fields: rokId, name' }, { status: 400 });
      }

      const payload = {
        id,
        rokId,
        name,
        allianceId,
      };

      const result = await prepareCreateOrUpdate(prisma.player, payload, {
        userId: session.userId,
        matchField: id ? 'id' : 'rokId',
      });

      results.push(result);
    }

    return NextResponse.json(
      {
        message:
          results.length === 1
            ? (results[0]?.id ? 'Governor updated' : 'Governor created')
            : `${results.length} governors processed`,
        player: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/governor error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'rokId must be unique' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to save governor(s)', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}