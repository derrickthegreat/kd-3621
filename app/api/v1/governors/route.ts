import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

      return NextResponse.json(player, { status: 200 });
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

    return NextResponse.json(players, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/governor error:', error);
    return NextResponse.json({ message: 'Error fetching governors', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const governors = Array.isArray(body) ? body : [body];

    const results = [];

    for (const gov of governors) {
      const { id, rokId, name, allianceId } = gov;

      if (!rokId || !name) {
        return NextResponse.json({ message: 'Missing required fields: rokId, name' }, { status: 400 });
      }

      const payload = {
        rokId,
        name,
        allianceId,
        updatedAt: new Date(),
      };

      let result;

      if (id) {
        result = await prisma.player.update({ where: { id }, data: payload });
      } else {
        const existing = await prisma.player.findUnique({ where: { rokId } });
        if (existing) {
          result = await prisma.player.update({ where: { rokId }, data: payload });
        } else {
          result = await prisma.player.create({ data: payload });
        }
      }

      results.push(result);
    }

    return NextResponse.json(
      {
        message: results.length === 1
          ? (body.id ? 'Governor updated' : 'Governor created')
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
