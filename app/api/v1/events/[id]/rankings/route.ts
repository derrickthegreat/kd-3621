import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API Endpoint: /api/events/[id]/ranking
 *
 * GET: List all rankings for the given event ID (via path param).
 *      Includes related application and player info.
 *
 * POST: Create or update rankings for applications.
 *       Accepts single or array of rankings:
 *
 * Example POST payload (single):
 * {
 *   "applicationId": "uuid-application",
 *   "rank": 1,
 *   "max_points": 1000
 * }
 *
 * Example POST payload (multiple):
 * [
 *   { "applicationId": "uuid1", "rank": 1, "max_points": 1000 },
 *   { "applicationId": "uuid2", "rank": 2, "max_points": 900 }
 * ]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rankings = await prisma.eventRanking.findMany({
      where: {
        application: {
          eventId: params.id,
        },
      },
      include: {
        application: {
          include: {
            player: true,
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return NextResponse.json(rankings, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/events/[id]/ranking error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch rankings', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const rankings = Array.isArray(body) ? body : [body];

    const results = [];

    for (const rankData of rankings) {
      const { applicationId, rank, max_points } = rankData;

      if (!applicationId || rank === undefined) {
        return NextResponse.json(
          { message: 'Missing required fields: applicationId, rank' },
          { status: 400 }
        );
      }

      // Confirm the application belongs to this event
      const application = await prisma.eventApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application || application.eventId !== params.id) {
        return NextResponse.json(
          { message: `Application ${applicationId} not found or does not belong to event` },
          { status: 400 }
        );
      }

      // Upsert ranking by applicationId
      const ranking = await prisma.eventRanking.upsert({
        where: { applicationId },
        update: {
          rank,
          max_points,
          updatedAt: new Date(),
        },
        create: {
          applicationId,
          rank,
          max_points,
        },
      });

      results.push(ranking);
    }

    return NextResponse.json(
      {
        message: results.length === 1 ? 'Ranking saved' : `${results.length} rankings saved`,
        rankings: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/events/[id]/ranking error:', error);
    return NextResponse.json(
      { message: 'Failed to save rankings', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
