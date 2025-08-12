import { NextRequest, NextResponse } from 'next/server';

// Mock database events data (simulating what would come from the database)
const mockDatabaseEvents = [
  {
    id: '1',
    name: 'MGE Week 1',
    startDate: '2025-01-15T00:00:00Z',
    endDate: '2025-01-21T23:59:59Z',
    description: 'Mightiest Governor Event - Week 1',
    color: '#3a94ee',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    closedAt: null,
    isArchived: false,
  },
  {
    id: '2',
    name: 'Wheel of Fortune',
    startDate: '2025-01-22T00:00:00Z',
    endDate: '2025-01-24T23:59:59Z',
    description: 'Wheel of Fortune Event',
    color: '#f99806',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    closedAt: null,
    isArchived: false,
  },
  {
    id: '3',
    name: 'Ark of Osiris',
    startDate: '2025-01-25T00:00:00Z',
    endDate: '2025-01-29T23:59:59Z',
    description: 'Ark of Osiris Event',
    color: '#339933',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    closedAt: null,
    isArchived: false,
  },
  {
    id: '4',
    name: 'More Than Gems',
    startDate: '2025-02-01T00:00:00Z',
    endDate: '2025-02-02T23:59:59Z',
    description: 'More Than Gems Event',
    color: '#FF5733',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    closedAt: null,
    isArchived: false,
  },
  {
    id: '5',
    name: 'KvK Training',
    startDate: '2025-02-10T00:00:00Z',
    endDate: '2025-02-10T23:59:59Z',
    description: 'Kingdom vs Kingdom Training Event',
    color: '#ff0066',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    closedAt: null,
    isArchived: false,
  },
];

/**
 * Mock API Endpoint: /api/v1/events
 * 
 * GET: List all events from mock data (simulating database)
 */
export async function GET(request: NextRequest) {
  try {
    // Simulate database query with ordering by startDate
    const events = mockDatabaseEvents
      .filter(event => !event.isArchived)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/v1/events error:', error);
    return NextResponse.json({ message: 'Failed to fetch events', error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // For now, just return a message that POST is not implemented in mock mode
  return NextResponse.json({ message: 'POST not implemented in mock mode' }, { status: 501 });
}