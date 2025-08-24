import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import AccessControlService from '@/lib/db/accessControlService';
import { prepareCreateOrUpdate } from '@/lib/db/prismaUtils';

const prisma = new PrismaClient();

/**
 * API Endpoint: /api/v1/governors
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
 *      GET /api/v1/governors                 => List all governors with stats
 *      GET /api/v1/governors?id=uuid123     => Get governor by ID with stats
 *      GET /api/v1/governors?rokId=rok456   => Get governor by rokId with stats
 *      GET /api/v1/governors?rokId=rok456&equipment=true&commanders=true
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

  // Access Control
  const session = await AccessControlService.getSessionInfo(request);
  const isPrivileged = session && AccessControlService.canRead(session.role);

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
        UserPlayers: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build a map of clerkId -> imageUrl for linked users (first link per player)
    const clerkIds = Array.from(new Set(
      players
        .map((p) => p.UserPlayers?.[0]?.user?.clerkId)
        .filter((id): id is string => !!id)
    ));
    const avatarMap = new Map<string, string>();
    try {
      const clerk = await clerkClient();
      await Promise.all(
        clerkIds.map(async (cid) => {
          try {
            const u = await clerk.users.getUser(cid);
            if (u?.imageUrl) avatarMap.set(cid, u.imageUrl);
          } catch {}
        })
      );
    } catch {}

    const sanitizedPlayers = players.map((p) => {
      const sp: any = sanitizePlayer({ ...p });
      const cid = p.UserPlayers?.[0]?.user?.clerkId;
      sp.userAvatar = cid ? avatarMap.get(cid) || null : null;
      // drop relation noise
      delete sp.UserPlayers;
      return sp;
    });
    return NextResponse.json(sanitizedPlayers, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/governor error:', error);
    return NextResponse.json({ message: 'Error fetching governors', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  // Access Control
  const session = await AccessControlService.getSessionInfo(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!AccessControlService.canWrite(session.role)) {
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