import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
  try {
    const data = await request.json();
    const materials: MaterialRequest[] = Array.isArray(data) ? data : [data];

    const results = [];

    for (const material of materials) {
      const { id, name, src, description } = material;

      if (!name) {
        return NextResponse.json({ message: 'Missing required field: name' }, { status: 400 });
      }

      let result;

      if (id) {
        // If an ID is provided, it's an update, and 'id' is a unique primary key
        result = await prisma.material.update({
          where: { id },
          data: {
            name,
            src,
            description,
            updatedAt: new Date(),
          },
        });
      } else {
        // If no ID, we check if a material with this name already exists
        // Use findFirst because 'name' is a unique field but not necessarily the @id
        const existing = await prisma.material.findFirst({ where: { name } });
        if (existing) {
          // If it exists, update it by its UNIQUE ID (existing.id)
          // This is the line causing the error if it was not correctly updated previously.
          result = await prisma.material.update({
            where: { id: existing.id }, // <--- THIS IS THE CRITICAL FIX
            data: {
              name, // Include name in data if it can also be updated
              src,
              description,
              updatedAt: new Date(),
            },
          });
        } else {
          // If it doesn't exist, create a new one
          result = await prisma.material.create({
            data: {
              name,
              src,
              description,
            },
          });
        }
      }

      results.push(result);
    }

    return NextResponse.json(
      {
        message:
          results.length === 1
            ? `${results[0].id ? 'Material updated' : 'Material created'}`
            : `${results.length} materials processed`,
        materials: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/equipment/materials error:', error);
    if (error.code === 'P2002') {
      // P2002 is Prisma's error code for unique constraint violation
      return NextResponse.json({ message: 'Material name must be unique' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to save materials', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}