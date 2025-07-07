import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

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
      },
    });

    return NextResponse.json({ message: 'Event closed', event: updatedEvent }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/events/[id]/close error:', error);
    return NextResponse.json(
      { message: 'Failed to close event', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
