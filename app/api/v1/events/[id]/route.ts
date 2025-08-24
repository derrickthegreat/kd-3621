import { NextRequest, NextResponse } from 'next/server';
import AccessControlService from '@/lib/db/accessControlService';
import { prisma } from '@/lib/db/prismaUtils';

/**
 * API Endpoint: /api/events/[id]
 *
 * Methods:
 *  - GET: Fetch event by ID
 *  - POST: Update event fields or archive event
 *    Payload example to update fields:
 *      { name, startDate, endDate, description, closedAt }
 *    Payload example to archive event:
 *      { archive: true }
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: id,
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found or archived' }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/events/[id] error:', error);
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to fetch event', error: error.message }, { status: 500 });
  }
}

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
    const data = await request.json();

    if (data.archive === true) {
      const archivedEvent = await prisma.event.update({
        where: { id },
        data: {
          isArchived: true,
          updatedAt: new Date(),
          updatedBy: session.userId,
        },
      });

      return NextResponse.json({ message: 'Event archived', event: archivedEvent }, { status: 200 });
    }

    const allowedFields = ['name', 'startDate', 'endDate', 'description', 'closedAt', 'color'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] =
          ['startDate', 'endDate', 'closedAt'].includes(field) && data[field]
            ? new Date(data[field])
            : data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();
    updateData.updatedBy = session.userId;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Event updated', event: updatedEvent }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/events/[id] error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to update event', error: error.message }, { status: 500 });
  }
}
