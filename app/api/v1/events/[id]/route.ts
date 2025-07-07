import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: params.id,
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found or archived' }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/events/[id] error:', error);
    return NextResponse.json({ message: 'Failed to fetch event', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    if (data.archive === true) {
      // Archive event by setting isArchived flag to true
      const archivedEvent = await prisma.event.update({
        where: { id: params.id },
        data: {
          isArchived: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ message: 'Event archived', event: archivedEvent }, { status: 200 });
    }

    // Otherwise, update event fields if provided
    const allowedFields = ['name', 'startDate', 'endDate', 'description', 'closedAt', 'color'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (field in data) {
        updateData[field] = data[field] ? new Date(data[field]) || data[field] : null;
        if (field === 'name' || field === 'description') {
          updateData[field] = data[field];
        } else {
          // For date fields
          updateData[field] = data[field] ? new Date(data[field]) : null;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Event updated', event: updatedEvent }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/events/[id] error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update event', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Reject all other methods explicitly
export async function PUT() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
