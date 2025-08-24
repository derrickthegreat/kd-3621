import { NextRequest, NextResponse } from 'next/server';
import AccessControlService from '@/lib/db/accessControlService';
import { prisma } from '@/lib/db/prismaUtils';

/**
 * API Endpoint: /api/events/[id]/close
 *
 * POST: Close an event by setting its `closedAt` timestamp.
 *
 * Example POST request:
 * POST /api/events/uuid-close
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await AccessControlService.getSessionInfo(request);
  if(!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if(!AccessControlService.canWrite(session.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  try {
    const eventId = id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    if (event.closedAt) {
      return NextResponse.json({ message: 'Event already closed' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        closedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({ message: 'Event closed', event: updatedEvent }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/events/[id]/close error:', error);
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json(
        { message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to close event', error: error.message },
      { status: 500 }
    );
  }
}
