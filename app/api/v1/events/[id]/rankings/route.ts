import { NextRequest, NextResponse } from 'next/server';
import AccessControlService from '@/lib/db/accessControlService';
import { prisma } from '@/lib/db/prismaUtils';
import { logUserAction } from '@/lib/db/audit';

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
  { params }: { params: Promise<{ id: string }>}
) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request);
  if(unauthorizedResponse) return unauthorizedResponse;

  const { id } = await params;

  try {
    const rankings = await prisma.eventRanking.findMany({
      where: {
        application: {
          eventId: id,
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
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json(
        { message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to fetch rankings', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await AccessControlService.getSessionInfo(request);
  if(!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if(!AccessControlService.canWrite(session.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  
  const { id } = await params;

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

      if (!application || application.eventId !== id) {
        return NextResponse.json(
          { message: `Application ${applicationId} not found or does not belong to event` },
          { status: 400 }
        );
      }

      // Upsert ranking by applicationId
      const ranking = await prisma.eventRanking.upsert({
        where: { eventId_applicationId: {
          eventId: id,
          applicationId
        } },
        update: {
          rank,
          max_points,
          updatedAt: new Date(),
          updatedBy: session.userId,
        },
        create: {
          eventId: id,
          applicationId,
          rank,
          max_points,
          createdAt: new Date(),
          createdBy: session.userId,
        },
      });

  results.push(ranking);
  await logUserAction({ action: `Set ranking for application ${applicationId} in event ${id} to #${rank}`, actorClerkId: session.userId })
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
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json(
        { message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to save rankings', error: error.message },
      { status: 500 }
    );
  }
}
