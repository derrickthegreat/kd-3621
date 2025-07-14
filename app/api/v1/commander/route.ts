import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TroopType } from '@prisma/client';
import AccessControlService from '@/lib/db/accessControlService';
import { prepareCreateOrUpdate } from '@/lib/db/prismaUtils';

const prisma = new PrismaClient();

/**
 * API Endpoint: /api/commander
 *
 * Methods:
 *  - GET: List all commanders or fetch one by 'id', with optional includes.
 *    Optional query params:
 *      - id: string (fetch a specific commander by unique id)
 *      - players: "true" | "false" (include associated players)
 *      - applications: "true" | "false" (include associated applications)
 *
 *    Example GET requests:
 *      GET /api/commander                   => List all commanders
 *      GET /api/commander?id=uuid123       => Get commander by ID
 *      GET /api/commander?id=uuid123&players=true&applications=true
 *                                         => Get commander with related players and applications
 *
 *  - POST: Create or update one or many commanders.
 *    Required fields per commander: name (string), iconUrl (string), speciality (string[])
 *    Optional: id (for updating)
 *
 *    Example POST request payloads:
 *
 *    // Single create
 *    {
 *      "name": "Commander Name",
 *      "iconUrl": "https://example.com/icon.png",
 *      "speciality": ["INFANTRY", "DEFENSE"]
 *    }
 *
 *    // Multiple create or update
 *    [
 *      {
 *        "name": "New Commander 1",
 *        "iconUrl": "https://example.com/1.png",
 *        "speciality": ["LEADERSHIP"]
 *      },
 *      {
 *        "id": "uuid123",
 *        "name": "Updated Commander",
 *        "iconUrl": "https://example.com/icon.png",
 *        "speciality": ["SUPPORT"]
 *      }
 *    ]
 */

export async function GET(request: NextRequest) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request);
  if(unauthorizedResponse) return unauthorizedResponse;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const includePlayers = searchParams.get('players') === 'true';
  const includeApplications = searchParams.get('applications') === 'true';

  try {
    if (id) {
      const commander = await prisma.commander.findUnique({
        where: { id },
        include: {
          players: includePlayers ? { include: { player: true } } : false,
          applications: includeApplications ? { include: { application: true } } : false,
        },
      });

      if (!commander) {
        return NextResponse.json({ message: 'Commander not found' }, { status: 404 });
      }

      return NextResponse.json(commander, { status: 200 });
    }

    const commanders = await prisma.commander.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(commanders, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/commander error:', error);
    return NextResponse.json({ message: 'Error fetching commanders', error: error.message }, { status: 500 });
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
    const commanders = Array.isArray(body) ? body : [body];

    const results = [];

    for (const commander of commanders) {
      const { id, name, iconUrl, speciality } = commander;

      if (!name || !iconUrl || !Array.isArray(speciality)) {
        return NextResponse.json(
          { message: 'Missing required fields: name, iconUrl, speciality[]' },
          { status: 400 }
        );
      }

      const payload = {
        id,
        name,
        iconUrl,
        speciality: speciality as TroopType[],
      };

      const result = await prepareCreateOrUpdate(prisma.commander, payload, {
        userId: session.userId,
      });

      results.push(result);
    }

    return NextResponse.json(
      {
        message:
          results.length === 1
            ? (results[0]?.id ? 'Commander updated' : 'Commander created')
            : `${results.length} commanders processed`,
        commander: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/commander error:', error);
    return NextResponse.json(
      { message: 'Failed to save commander(s)', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}