import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TroopType, Rarity, Prisma } from '@prisma/client';
import AccessControlService from '@/lib/db/accessControlService';
import { prepareCreateOrUpdate } from '@/lib/db/prismaUtils';

const prisma = new PrismaClient();
const HAS_RARITY = !!(Prisma as any)?.dmmf?.datamodel?.models?.some((m: any) => m.name === 'Commander' && m.fields?.some((f: any) => f.name === 'rarity'))

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

  const results: any[] = [];
  const errors: { name?: string; id?: string; message: string }[] = [];

    for (const commander of commanders) {
      try {
  const { id, name, iconUrl, speciality, rarity } = commander;
  const normName = String(name).trim();
  const normIcon = String(iconUrl).trim();

  if (!normName || !normIcon || !Array.isArray(speciality)) {
        return NextResponse.json(
          { message: 'Missing required fields: name, iconUrl, speciality[]' },
          { status: 400 }
        );
      }

      // Normalize speciality: uppercase, unique, validate against TroopType, enforce max 3
      const normalized = Array.from(new Set((speciality as string[]).map((s) => String(s).toUpperCase())));
      const valid = normalized.filter((s): s is TroopType => Object.keys(TroopType).includes(s));
      if (valid.length > 3) {
        return NextResponse.json({ message: 'A commander can have at most 3 specialities' }, { status: 400 });
      }

      // Normalize rarity if provided
      let rar: Rarity | undefined = undefined;
      if (typeof rarity === 'string' && rarity.trim()) {
        const up = rarity.trim().toUpperCase();
        if ((Object.keys(Rarity) as string[]).includes(up)) {
          rar = up as Rarity;
        } else {
          return NextResponse.json({ message: `Invalid rarity: ${rarity}` }, { status: 400 });
        }
      }

      // If id provided, update by id; otherwise upsert by unique name
      let result;
      if (id) {
  const data: any = { name: normName, iconUrl: normIcon, speciality: { set: valid as TroopType[] } };
  if (rar && HAS_RARITY) data.rarity = rar;
        result = await prisma.commander.update({ where: { id }, data });
      } else {
        const existing = await prisma.commander.findFirst({ where: { name: { equals: normName, mode: 'insensitive' } } })
        if (existing) {
          const data: any = { name: normName, iconUrl: normIcon, speciality: { set: valid as TroopType[] } };
          if (rar && HAS_RARITY) data.rarity = rar;
          result = await prisma.commander.update({ where: { id: existing.id }, data })
        } else {
          const data: any = { name: normName, iconUrl: normIcon, speciality: valid as TroopType[], createdBy: session.userId };
          if (rar && HAS_RARITY) data.rarity = rar;
          result = await prisma.commander.create({ data })
        }
      }

      results.push(result);
      } catch (e: any) {
        errors.push({ id: commander.id, name: commander.name, message: e?.message || 'Unknown error' })
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json({ message: 'No commanders saved', errors }, { status: 400 })
    }

    return NextResponse.json({
      message: `${results.length} commander${results.length === 1 ? '' : 's'} processed${errors.length ? `, ${errors.length} failed` : ''}`,
      commander: results,
      errors,
    }, { status: 200 });
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

export async function PUT(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'Missing commander id' }, { status: 400 })

  try {
    const body = await request.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.isArchived === 'boolean') data.isArchived = body.isArchived
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.iconUrl === 'string' && body.iconUrl.trim()) data.iconUrl = body.iconUrl.trim()
    if (Array.isArray(body.speciality)) data.speciality = body.speciality
  if (typeof body.rarity === 'string' && body.rarity.trim() && HAS_RARITY) {
      const up = body.rarity.trim().toUpperCase()
      if ((Object.keys(Rarity) as string[]).includes(up)) data.rarity = up
      else return NextResponse.json({ message: `Invalid rarity: ${body.rarity}` }, { status: 400 })
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 })
    }
    data.updatedBy = session.userId
    const updated = await prisma.commander.update({ where: { id }, data })
    return NextResponse.json(updated, { status: 200 })
  } catch (error: any) {
    console.error('PUT /api/commander error:', error)
    return NextResponse.json({ message: 'Failed to update commander', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}