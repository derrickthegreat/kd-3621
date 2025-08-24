import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import AccessControlService from '@/lib/db/accessControlService';
import { prepareCreateOrUpdate } from '@/lib/db/prismaUtils';

const prisma = new PrismaClient();

interface MaterialRequest {
  id?: string;
  name: string;
  src?: string;
  description?: string;
}

/**
 * === GET /api/equipment/materials ===
 * Fetch one or many materials used to build equipment items.
 *
 * Query Parameters:
 * - id (optional): UUID of the material to fetch
 * - name (optional): Case-sensitive name of the material
 *
 * Example usage:
 * GET /api/equipment/materials?id=abc-123
 * GET /api/equipment/materials?name=Iron Ore
 * GET /api/equipment/materials
 *
 * Returns material(s) as JSON.
 */
export async function GET(request: NextRequest) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request);
  if (unauthorizedResponse) return unauthorizedResponse;
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const name = searchParams.get('name');

  try {
    if (id || name) {
      let material;
      if (id) {
        material = await prisma.material.findUnique({
          where: { id }, // Using findUnique is fine when querying by @id
        });
      } else if (name) {
        material = await prisma.material.findFirst({ // Changed to findFirst for 'name'
          where: { name: name }, // 'name!' is fine, but name is already known to be non-null here
        });
      }

      if (!material) {
        return NextResponse.json({ message: 'Material not found' }, { status: 404 });
      }

      return NextResponse.json(material, { status: 200 });
    }

    const materials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(materials, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/equipment/materials error:', error);
    return NextResponse.json({ message: 'Failed to fetch materials', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * === POST /api/equipment/materials ===
 * Create or update one or more materials.
 *
 * Request Body: A single material object or an array of materials with the following shape:
 * {
 *   id?: string (optional, for updates)
 *   name: string (required)
 *   src?: string
 *   description?: string
 * }
 *
 * Example usage:
 * POST /api/equipment/materials
 * Body:
 * {
 *   "name": "Gold Ingot",
 *   "src": "/images/materials/gold.png",
 *   "description": "Refined gold used in legendary equipment"
 * }
 *
 * OR
 * [
 *   { "name": "Silver Ore", "src": "/images/silver.png" },
 *   { "name": "Leather", "description": "Flexible and durable material" }
 * ]
 *
 * Returns saved material(s) as JSON.
 */
export async function POST(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request);
  if(!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if(!AccessControlService.canWrite(session.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const materials: MaterialRequest[] = Array.isArray(data) ? data : [data];

    const results = [];

    for (const material of materials) {
      const { id, name, src, description } = material;

      if (!name) {
        return NextResponse.json({ message: 'Missing required field: name' }, { status: 400 });
      }

      const payload = {
        id,
        name,
        src,
        description,
      };

      const result = await prepareCreateOrUpdate(prisma.material, payload, {
        userId: session.userId,
        matchField: 'name', // Match on 'name' when no ID
      });

      results.push(result);
    }

    return NextResponse.json(
      {
        message:
          results.length === 1
            ? 'Material saved'
            : `${results.length} materials processed`,
        materials: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/equipment/materials error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Material name must be unique' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to save materials', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// === DELETE /api/equipment/materials ===
// Delete a material by id or name. Also removes equipment material links.
export async function DELETE(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request);
  if(!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if(!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const name = searchParams.get('name');

  try {
    const existing = await prisma.material.findFirst({ where: id ? { id } : { name: name! } });
    if (!existing) return NextResponse.json({ message: 'Material not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.equipmentMaterial.deleteMany({ where: { materialId: existing.id } }),
      prisma.material.delete({ where: { id: existing.id } }),
    ]);

    return NextResponse.json({ message: 'Material deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/equipment/materials error:', error);
    return NextResponse.json({ message: 'Failed to delete material', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}