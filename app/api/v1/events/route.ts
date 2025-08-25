import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prismaUtils';
import access from '@/services/AccessControlService';
import { logUserAction } from '@/lib/db/audit';

/**
 * Mock API Endpoint: /api/v1/events
 * 
 * GET: List all events from mock data (simulating database)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
      return NextResponse.json(event, { status: 200 });
    }
    const archived = searchParams.get('archived');
    let where: any = {};
    if (archived === 'true') {
      where.isArchived = true;
    } else {
      where.isArchived = false;
    }
    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/v1/events error:', error);
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to fetch events', error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await access.getSessionInfo(request);
    const body = await request.json();
    const event = await prisma.event.create({
      data: {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        description: body.description || null,
        color: body.color || null,
        createdBy: body.createdBy || session?.userId || 'system',
      },
    });
    // audit
    await logUserAction({
      action: `Created event ${event.name} (${event.id})`,
      actorClerkId: session?.userId,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/v1/events error:', error);
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to create event', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'Missing event id' }, { status: 400 });
  const session = await access.getSessionInfo(request);
    const body = await request.json();
    let updateData: any = {};
    if (typeof body.archived !== 'undefined' || typeof body.isArchived !== 'undefined') {
      updateData.isArchived = body.archived ?? body.isArchived;
      if (updateData.isArchived) {
        updateData.closedAt = new Date();
      }
    }
    if (body.name) updateData.name = body.name;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.description) updateData.description = body.description;
    if (body.color) updateData.color = body.color;
    if (body.updatedBy) updateData.updatedBy = body.updatedBy;
    // Only update if there is something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
  const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });
  await logUserAction({ action: `Updated event ${event.name} (${event.id})`, actorClerkId: session?.userId });
    return NextResponse.json(event, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/v1/events error:', error);
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to update event', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'Missing event id' }, { status: 400 });
  const session = await access.getSessionInfo(request);
  const existing = await prisma.event.findUnique({ where: { id } });
    await prisma.event.delete({ where: { id } });
  await logUserAction({ action: `Deleted event ${existing?.name ?? id}`, actorClerkId: session?.userId });
    return NextResponse.json({ message: 'Event deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/v1/events error:', error);
    const code = error?.code || (typeof error?.message === 'string' && error.message.includes("Can't reach database server") ? 'P1001' : undefined)
    if (code === 'P1001') {
      return NextResponse.json({ message: 'Database unavailable', hint: 'Check DATABASE_URL and database availability.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to delete event', error: error.message }, { status: 500 });
  }
}