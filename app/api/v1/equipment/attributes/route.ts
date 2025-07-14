/**
 * === Equipment Attributes API ===
 * Endpoint: /api/equipment/attributes
 *
 * Supports:
 * - GET: Fetch all attributes or a single one by `id` or `name`.
 * - POST: Create or update one or more attributes.
 *
 * ---
 *
 * GET /api/equipment/attributes
 * ------------------------------
 * Query Parameters:
 * - id=[string]           → Fetch attribute by ID
 * - name=[string]         → Fetch attribute by name
 *
 * Example:
 *   /api/equipment/attributes?name=Health
 *
 * Response:
 *   Single attribute object or array of attributes.
 *
 * ---
 *
 * POST /api/equipment/attributes
 * ------------------------------
 * Accepts:
 * - A single attribute or an array of attributes.
 * - Fields: name (required), description (optional), isIconic (optional, default: false)
 *
 * Example:
 * {
 *   "name": "Health",
 *   "description": "+4.5% infantry health",
 *   "isIconic": false
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import AccessControlService from '@/lib/db/accessControlService';
import { prepareCreateOrUpdate } from '@/lib/db/prismaUtils';

const prisma = new PrismaClient();

interface AttributeRequest {
  id?: string;
  name: string;
  description?: string;
  isIconic?: boolean;
}

export async function GET(request: NextRequest) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const name = searchParams.get('name');

  try {
    if (id || name) {
      const attribute = await prisma.attribute.findFirst({
        where: id ? { id } : { name: name! },
      });

      if (!attribute) {
        return NextResponse.json({ message: 'Attribute not found' }, { status: 404 });
      }

      return NextResponse.json(attribute, { status: 200 });
    }

    const attributes = await prisma.attribute.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(attributes, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/equipment/attributes error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch attributes', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request);
  if(!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if(!AccessControlService.canWrite(session.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const attributes: AttributeRequest[] = Array.isArray(body) ? body : [body];

    const results = [];

    for (const attr of attributes) {
      const { id, name, description, isIconic } = attr;

      if (!name) {
        return NextResponse.json(
          { message: 'Missing required field: name' },
          { status: 400 }
        );
      }

      const payload = {
        id,
        name,
        description,
        isIconic: isIconic ?? false,
      };

      const result = await prepareCreateOrUpdate(prisma.attribute, payload, {
        userId: session.userId,
        matchField: 'name',
      });

      results.push(result);
    }

    return NextResponse.json(
      {
        message:
          results.length === 1
            ? 'Attribute saved'
            : `${results.length} attributes processed`,
        attributes: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/equipment/attributes error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Attribute name must be unique' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to save attribute', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}