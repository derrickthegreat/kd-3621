import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API Endpoint: /api/events/[id]/application
 *
 * Supports:
 *
 * GET /api/events/[id]/application?status=STATUS
 *  - Fetch all applications for a given event ID.
 *  - Optional query param `status` filters by application status (NEW, REVIEWING, APPROVED, DECLINED, CLOSED).
 *  - Returns applications including related player, commanders, equipment, rankings, and alliance info.
 *
 * POST /api/events/[id]/application
 *  - Create or update an event application for a player.
 *  - Automatically syncs assigned commanders and equipment.
 *  - Equipment entries can specify `isCrit` (boolean) and `iconicTier` (integer 0-5) if equipment is LEGENDARY rarity.
 *  - Validation:
 *     - `playerId` is required.
 *     - For LEGENDARY equipment, `iconicTier` must be between 0 and 5.
 *  - Payload example:
 *    {
 *      "playerId": "uuid-player",
 *      "status": "REVIEWING",
 *      "commanders": ["uuid-commander1", "uuid-commander2"],
 *      "equipment": [
 *        { "equipmentId": "uuid-equipment1", "iconicTier": 3, "isCrit": true },
 *        { "equipmentId": "uuid-equipment2", "isCrit": false }
 *      ]
 *    }
 *
 * Responses:
 *  - 200: Success with full application data.
 *  - 400: Validation errors such as missing playerId or invalid iconicTier.
 *  - 500: Internal server error.
 */

export interface EventsParams {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as Status | null;

  try {
    const applications = await prisma.eventApplication.findMany({
      where: {
        eventId: id,
        ...(status ? { status } : {}),
      },
      include: {
        player: true,
        commanders: { include: { commander: true } },
        equipment: { include: { equipment: true } },
        EventRanking: true,
        Alliance: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(applications, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/events/[id]/application error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch applications', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { playerId, status, commanders = [], equipment = [] } = body;

    if (!playerId) {
      return NextResponse.json({ message: 'Missing required playerId' }, { status: 400 });
    }

    // Upsert application (create or update)
    const application = await prisma.eventApplication.upsert({
      where: {
        eventId_playerId: {
          eventId: id,
          playerId,
        },
      },
      update: {
        status: status ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        eventId: id,
        playerId,
        status: status ?? 'NEW',
      },
    });

    // Sync commanders
    await prisma.applicationCommander.deleteMany({
      where: { applicationId: application.id },
    });
    await prisma.applicationCommander.createMany({
      data: commanders.map((commanderId: string) => ({
        applicationId: application.id,
        commanderId,
      })),
      skipDuplicates: true,
    });

    // Validate and sync equipment
    await prisma.applicationEquipment.deleteMany({
      where: { applicationId: application.id },
    });

    // Fetch equipment rarities for validation
    const equipmentIds = equipment.map((eq: any) => eq.equipmentId);
    const equipmentRecords = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, rarity: true },
    });
    const equipmentRarityMap = new Map(equipmentRecords.map(eq => [eq.id, eq.rarity]));

    // Validate each equipment
    for (const eq of equipment) {
      const rarity = equipmentRarityMap.get(eq.equipmentId);
      if (!rarity) {
        return NextResponse.json({ message: `Equipment not found: ${eq.equipmentId}` }, { status: 400 });
      }
      if (rarity === 'LEGENDARY') {
        if (typeof eq.iconicTier !== 'number' || eq.iconicTier < 0 || eq.iconicTier > 5) {
          return NextResponse.json({
            message: `iconicTier must be a number between 0 and 5 for legendary equipment: ${eq.equipmentId}`,
          }, { status: 400 });
        }
      }
    }

    // Create equipment records with iconicTier and isCrit
    await prisma.applicationEquipment.createMany({
      data: equipment.map((eq: any) => ({
        applicationId: application.id,
        equipmentId: eq.equipmentId,
        iconicTier: eq.iconicTier && eq.iconicTier >= 0 && eq.iconicTier <= 5 ? eq.iconicTier : null,
        isCrit: !!eq.isCrit,
      })),
      skipDuplicates: true,
    });

    const fullApplication = await prisma.eventApplication.findUnique({
      where: { id: application.id },
      include: {
        player: true,
        commanders: { include: { commander: true } },
        equipment: { include: { equipment: true } },
        EventRanking: true,
        Alliance: true,
      },
    });

    return NextResponse.json(
      { message: 'Application submitted', application: fullApplication },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/events/[id]/application error:', error);
    return NextResponse.json(
      { message: 'Failed to submit application', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
