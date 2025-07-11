import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Rarity, Slot } from '@prisma/client';
import { getSessionInfo, canWrite } from '@/lib/accessControlService';

const prisma = new PrismaClient();
/**
 * === Equipment API ===
 * Endpoint: /api/equipment
 *
 * Supports:
 * - GET: Fetch all equipment, or a single item by `id` or `name`, with optional inclusion of attributes, iconics, and materials.
 * - POST: Create or update one or more equipment records, including nested attributes, iconics, and materials.
 *
 * ---
 *
 * GET /api/equipment
 * ------------------
 * Query Parameters:
 * - id=[string]             → Fetch a specific equipment item by ID
 * - name=[string]           → Fetch a specific equipment item by name
 * - includeAttributes=true  → Include linked attributes and their values
 * - includeIconic=true      → Include iconic attributes and tier info
 * - includeMaterials=true   → Include material requirements
 *
 * Example:
 * /api/equipment?id=abc123&includeAttributes=true&includeIconic=true
 *
 * Response:
 * Returns a single equipment item (if id/name provided) or a list of all items.
 *
 * ---
 *
 * POST /api/equipment
 * -------------------
 * Accepts:
 * - A single equipment object OR an array of equipment objects.
 * - Automatically handles creation or update based on `id` (if provided).
 *
 * Required Fields:
 * - name: string
 * - slot: Slot enum ("HEAD" | "CHEST" | "HANDS" | "FEET" | "WEAPON" | "ACCESSORY")
 * - rarity: Rarity enum ("COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY")
 * - src: string (image URL)
 *
 * Optional Fields:
 * - alt: string (image alt text)
 * - attributes: Array of { attributeId, value? }
 * - iconic: Array of { attributeId, value?, tier? }
 * - materials: Array of { materialId, rarity?, quantity? }
 *
 * Example Payload (Single):
 * {
 * "name": "Shadow Legion's Retribution",
 * "slot": "CHEST",
 * "rarity": "LEGENDARY",
 * "src": "/icons/equipment/retribution.png",
 * "alt": "Shadow Legion's Retribution",
 * "attributes": [
 * { "attributeId": "attr123", "value": "3.5%" }
 * ],
 * "iconic": [
 * { "attributeId": "iconic456", "value": "2.5%", "tier": 2 }
 * ],
 * "materials": [
 * { "materialId": "mat789", "rarity": "LEGENDARY", "quantity": 10 }
 * ]
 * }
 *
 * Example Payload (Batch):
 * [
 * { "name": "Helm of the Phoenix", "slot": "HEAD", "rarity": "EPIC", "src": "/helm.png" },
 * { "name": "Gloves of Fury", "slot": "HANDS", "rarity": "RARE", "src": "/gloves.png" }
 * ]
 *
 * Response:
 * { message: "...", equipment: [...] }
 */

interface EquipmentAttributeInput {
  attributeId: string;
  value?: string | null;
}

interface EquipmentIconicAttributeInput {
  attributeId: string;
  value?: string | null;
  tier?: number | null;
}

interface EquipmentMaterialInput {
  materialId: string;
  rarity?: Rarity | null;
  quantity?: number;
}

interface EquipmentRequest {
  id?: string;
  name: string;
  slot: Slot;
  rarity: Rarity;
  src: string;
  alt?: string;
  attributes?: EquipmentAttributeInput[];
  iconic?: EquipmentIconicAttributeInput[];
  materials?: EquipmentMaterialInput[];
}

// === GET: Fetch all or single equipment ===
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const name = searchParams.get('name');
  const includeAttributes = searchParams.get('includeAttributes') === 'true';
  const includeIconic = searchParams.get('includeIconic') === 'true';
  const includeMaterials = searchParams.get('includeMaterials') === 'true';

  try {
    let equipment: any = null; // Initialize equipment variable

    if (id) {
      equipment = await prisma.equipment.findUnique({
        where: { id },
        include: {
          attributes: includeAttributes
            ? { include: { attribute: true } }
            : false,
          iconic: includeIconic
            ? { include: { attribute: true } }
            : false,
          materials: includeMaterials
            ? { include: { material: true } }
            : false,
        },
      });
    } else if (name) { // Use else if to handle 'name' only if 'id' is not present
      equipment = await prisma.equipment.findFirst({ // <--- FIX: Changed findUnique to findFirst
        where: { name: name },
        include: {
          attributes: includeAttributes
            ? { include: { attribute: true } }
            : false,
          iconic: includeIconic
            ? { include: { attribute: true } }
            : false,
          materials: includeMaterials
            ? { include: { material: true } }
            : false,
        },
      });
    }

    if (id || name) { // Check if a specific query was attempted
      if (!equipment) {
        return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
      }
      return NextResponse.json(equipment, { status: 200 });
    }

    // List all equipment with optional includes if no specific id or name was provided
    const equipmentList = await prisma.equipment.findMany({
      include: {
        attributes: includeAttributes ? { include: { attribute: true } } : false,
        iconic: includeIconic ? { include: { attribute: true } } : false,
        materials: includeMaterials ? { include: { material: true } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(equipmentList, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/equipment error:', error);
    return NextResponse.json({ message: 'Failed to fetch equipment', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// === POST: Create or update equipment with nested relations ===
export async function POST(request: NextRequest) {
  const session = await getSessionInfo();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await request.json();

    // Normalize input to always be an array for easier processing
    const equipments = Array.isArray(data) ? data : [data];

    const results = [];

    for (const equipmentData of equipments) {
      const {
        id,
        name,
        slot,
        rarity,
        src,
        alt,
        attributes = [],
        iconic = [],
        materials = [],
      } = equipmentData;

      // Basic validation
      if (!name || !slot || !rarity || !src) {
        return NextResponse.json(
          { message: 'Missing required fields: name, slot, rarity, src' },
          { status: 400 }
        );
      }

      let result;

      if (id) {
        // Update existing equipment by ID
        const attributesData = attributes.map((attr: { attributeId: any; value: any; }) => ({
          where: { equipmentId_attributeId: { equipmentId: id, attributeId: attr.attributeId } },
          create: { attributeId: attr.attributeId, value: attr.value ?? null },
          update: { value: attr.value ?? null },
        }));

        const iconicData = iconic.map((iconicAttr: { attributeId: any; value: any; tier: any; }) => ({
          where: { equipmentId_attributeId: { equipmentId: id, attributeId: iconicAttr.attributeId } },
          create: { attributeId: iconicAttr.attributeId, value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
          update: { value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
        }));

        const materialsData = materials.map((material: { materialId: any; rarity: any; quantity: any; }) => ({
          where: { equipmentId_materialId: { equipmentId: id, materialId: material.materialId } },
          create: {
            materialId: material.materialId,
            rarity: material.rarity ?? null,
            quantity: material.quantity ?? 1,
          },
          update: {
            rarity: material.rarity ?? null,
            quantity: material.quantity ?? 1,
          },
        }));

        result = await prisma.equipment.update({
          where: { id },
          data: {
            name,
            slot,
            rarity,
            src,
            alt,
            updatedAt: new Date(),
            attributes: {
              upsert: attributesData,
              deleteMany: {
                attributeId: { notIn: attributes.map((a: { attributeId: any; }) => a.attributeId) },
              },
            },
            iconic: {
              upsert: iconicData,
              deleteMany: {
                attributeId: { notIn: iconic.map((i: { attributeId: any; }) => i.attributeId) },
              },
            },
            materials: {
              upsert: materialsData,
              deleteMany: {
                materialId: { notIn: materials.map((m: { materialId: any; }) => m.materialId) },
              },
            },
          },
        });
      } else {
        // Create new equipment and nested relations
        // Before creating, check if an equipment with the same name already exists
        // This is to prevent creating duplicates if 'name' is a unique field in your schema
        const existingEquipmentByName = await prisma.equipment.findFirst({ where: { name } });

        if (existingEquipmentByName) {
          // If equipment with this name exists, update it instead of creating a duplicate
          result = await prisma.equipment.update({
            where: { id: existingEquipmentByName.id }, // Update by ID of the existing record
            data: {
              slot,
              rarity,
              src,
              alt,
              updatedAt: new Date(),
              attributes: {
                upsert: attributes.map((attr: { attributeId: any; value: any; }) => ({
                  where: { equipmentId_attributeId: { equipmentId: existingEquipmentByName.id, attributeId: attr.attributeId } },
                  create: { attributeId: attr.attributeId, value: attr.value ?? null },
                  update: { value: attr.value ?? null },
                })),
                deleteMany: {
                  attributeId: { notIn: attributes.map((a: { attributeId: any; }) => a.attributeId) },
                },
              },
              iconic: {
                upsert: iconic.map((iconicAttr: { attributeId: any; value: any; tier: any; }) => ({
                  where: { equipmentId_attributeId: { equipmentId: existingEquipmentByName.id, attributeId: iconicAttr.attributeId } },
                  create: { attributeId: iconicAttr.attributeId, value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
                  update: { value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
                })),
                deleteMany: {
                  attributeId: { notIn: iconic.map((i: { attributeId: any; }) => i.attributeId) },
                },
              },
              materials: {
                upsert: materials.map((material: { materialId: any; rarity: any; quantity: any; }) => ({
                  where: { equipmentId_materialId: { equipmentId: existingEquipmentByName.id, materialId: material.materialId } },
                  create: {
                    materialId: material.materialId,
                    rarity: material.rarity ?? null,
                    quantity: material.quantity ?? 1,
                  },
                  update: {
                    rarity: material.rarity ?? null,
                    quantity: material.quantity ?? 1,
                  },
                })),
                deleteMany: {
                  materialId: { notIn: materials.map((m: { materialId: any; }) => m.materialId) },
                },
              },
            },
          });
        } else {
          // No existing equipment with this name, so create a new one
          result = await prisma.equipment.create({
            data: {
              name,
              slot,
              rarity,
              src,
              alt,
              attributes: {
                create: attributes.map((a: { attributeId: any; value: any; }) => ({
                  attribute: { connect: { id: a.attributeId } },
                  value: a.value ?? null,
                })),
              },
              iconic: {
                create: iconic.map((i: { attributeId: any; value: any; tier: any; }) => ({
                  attribute: { connect: { id: i.attributeId } },
                  value: i.value ?? null,
                  tier: i.tier ?? null,
                })),
              },
              materials: {
                create: materials.map((m: { materialId: any; rarity: any; quantity: any; }) => ({
                  material: { connect: { id: m.materialId } },
                  rarity: m.rarity ?? null,
                  quantity: m.quantity ?? 1,
                })),
              },
            },
          });
        }
      }

      // Ensure 'result' is assigned before pushing, especially if using a complex if/else structure
      if (result) {
        results.push(result);
      }
    }

    // Return a single object if input was single, else array of results
    return NextResponse.json(
      {
        message: results.length === 1 ?
          (results[0].id ? 'Equipment updated' : 'Equipment created') :
          `${results.length} equipment items processed`,
        equipment: results.length === 1 ? results[0] : results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/equipment error:', error);
    if (error.code === 'P2002') {
      // P2002 is Prisma's error code for unique constraint violation (e.g., duplicate name)
      return NextResponse.json({ message: 'Equipment name must be unique' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to save equipment', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}