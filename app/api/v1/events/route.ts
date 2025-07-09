import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API Endpoint: /api/events
 *
 * GET: List all events or fetch one by ID (via query param ?id=)
 *
 * POST: Create or update one or more events.
 *   Each event must include name and startDate.
 *   Optional fields: endDate, description
 *
 * Example POST body:
 *   {
 *     "name": "MGE Week 3",
 *     "startDate": "2025-08-01T00:00:00Z",
 *     "endDate": "2025-08-07T00:00:00Z",
 *     "description": "Top kill event"
 *   }
 *
 *   OR array of objects
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) {
        return NextResponse.json({ message: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json(event, { status: 200 });
    }

    const events = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ message: 'Failed to fetch events', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const inputEvents = Array.isArray(data) ? data : [data];

    const results = [];
    for (const event of inputEvents) {
      const { id, name, startDate, endDate, description } = event;

      if (!name || !startDate) {
        return NextResponse.json({ message: 'Missing required fields: name, startDate' }, { status: 400 });
      }

      let result;
      if (id) {
        result = await prisma.event.update({
          where: { id },
          data: {
            name,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            description,
            updatedAt: new Date(),
          },
        });
      } else {
        result = await prisma.event.create({
          data: {
            name,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            description,
          },
        });
      }

      results.push(result);
    }

    return NextResponse.json(
      {
        message: results.length === 1 ? 'Event processed' : `${results.length} events processed`,
        events: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ message: 'Failed to save events', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
