import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Rarity, Slot } from '@prisma/client';
import AccessControlService from '@/lib/db/accessControlService';

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

// interface EquipmentRequest {
//   id?: string;
//   name: string;
//   slot: Slot;
//   rarity: Rarity;
//   src: string;
//   alt?: string;
//   attributes?: EquipmentAttributeInput[];
//   iconic?: EquipmentIconicAttributeInput[];
//   materials?: EquipmentMaterialInput[];
// }

// === GET: Fetch all or single equipment ===
export async function GET(request: NextRequest) {
  const unauthorizedResponse = await AccessControlService.requireReadAccess(request);
  if(unauthorizedResponse) return unauthorizedResponse;

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
      equipment = await prisma.equipment.findFirst({
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
  const session = await AccessControlService.getSessionInfo(request);
  if(!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if(!AccessControlService.canWrite(session.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  try {
    const data = await request.json();

    // Normalize input to always be an array for easier processing
    const equipments = Array.isArray(data) ? data : [data];

    // Caches to avoid repeated DB lookups per name
    const attributeCache = new Map<string, string>() // key: lower(name) => id
  const materialCache = new Map<string, string>() // key: lower(name) => id
  const materialIdNameCache = new Map<string, string>() // key: id => lower(name)

    async function getOrCreateAttributeByName(name: string, isIconic: boolean): Promise<string | null> {
      const key = String(name || '').trim().toLowerCase()
      if (!key) return null
      if (attributeCache.has(key)) return attributeCache.get(key)!
      const existing = await prisma.attribute.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } })
      if (existing) { attributeCache.set(key, existing.id); return existing.id }
      const created = await prisma.attribute.create({ data: { name: name.trim(), isIconic } })
      attributeCache.set(key, created.id)
      return created.id
    }

    async function getOrCreateMaterialByName(name: string): Promise<string | null> {
      const key = String(name || '').trim().toLowerCase()
      if (!key) return null
      if (materialCache.has(key)) return materialCache.get(key)!
      const existing = await prisma.material.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } })
      if (existing) { materialCache.set(key, existing.id); materialIdNameCache.set(existing.id, key); return existing.id }
      const created = await prisma.material.create({ data: { name: name.trim() } })
      materialCache.set(key, created.id)
      materialIdNameCache.set(created.id, key)
      return created.id
    }

    function normalizeRarity(input: any): Rarity | null {
      const s = String(input || '').trim().toUpperCase()
      const map: Record<string, Rarity> = {
        COMMON: 'COMMON', NORMAL: 'COMMON',
        UNCOMMON: 'UNCOMMON', ADVANCED: 'UNCOMMON',
        RARE: 'RARE', ELITE: 'RARE',
        EPIC: 'EPIC',
        LEGENDARY: 'LEGENDARY',
      }
      return (map as any)[s] ?? null
    }

  async function resolveAttributesArray(raw: any, options: { iconic?: boolean }): Promise<{ attributeId: string; value?: string | null; tier?: number | null }[]> {
      const iconic = !!options.iconic
      const out: { attributeId: string; value?: string | null; tier?: number | null }[] = []
      const arrs: any[] = []
      if (Array.isArray(raw?.attributes)) arrs.push({ data: raw.attributes, iconic: false })
      if (Array.isArray(raw?.attributesByName)) arrs.push({ data: raw.attributesByName, iconic: false })
      if (Array.isArray(raw?.iconic)) arrs.push({ data: raw.iconic, iconic: true })
      if (Array.isArray(raw?.iconicByName)) arrs.push({ data: raw.iconicByName, iconic: true })

      // Choose only the arrays matching requested iconic flag
      const chosen = arrs.filter(a => a.iconic === iconic)
      for (const bucket of chosen) {
        for (const item of bucket.data) {
          const val = item?.value
          const valueStr = val === undefined || val === null ? null : String(val)
          if (item?.attributeId) {
            out.push({ attributeId: item.attributeId, value: valueStr, tier: item?.tier ?? null })
            continue
          }
          // Accept multiple input keys for attribute name (name, attributeName, stat)
          const name = item?.name ?? item?.attributeName ?? item?.stat
          const id = await getOrCreateAttributeByName(name, iconic)
          if (!id) continue
          out.push({ attributeId: id, value: valueStr, tier: item?.tier ?? null })
        }
      }
      return out
    }

  async function resolveMaterialsArray(raw: any): Promise<{ materialId: string; rarity?: Rarity | null; quantity?: number }[]> {
      const out: { materialId: string; rarity?: Rarity | null; quantity?: number }[] = []
      const arrays: any[] = []
      if (Array.isArray(raw?.materials)) arrays.push(raw.materials)
      if (Array.isArray(raw?.materialsByName)) arrays.push(raw.materialsByName)
      for (const arr of arrays) {
        for (const item of arr) {
          let materialId: string | null = null
          let nameLower: string | null = null
          if (item?.materialId) {
            materialId = String(item.materialId)
            nameLower = materialIdNameCache.get(materialId) || null
            if (!nameLower) {
              const m = await prisma.material.findUnique({ where: { id: materialId } })
              if (m?.name) { nameLower = m.name.trim().toLowerCase(); materialIdNameCache.set(materialId, nameLower) }
            }
          } else {
            // Accept multiple input keys for material name (name, materialName, material)
            const name = item?.name ?? item?.materialName ?? item?.material
            const id = await getOrCreateMaterialByName(name)
            materialId = id
            nameLower = String(name || '').trim().toLowerCase() || null
          }
          if (!materialId) continue

          let rarity = normalizeRarity(item?.rarity)
          const qty = item?.quantity ?? item?.value ?? 1
          // Auto-default rarity for non-gold materials when not specified
          if (!rarity) {
            const isGold = !!nameLower && nameLower === 'gold'
            if (!isGold) {
              rarity = normalizeRarity(raw?.rarity) // equipment rarity
            }
          }
          out.push({ materialId: materialId!, rarity: rarity ?? null, quantity: qty })
        }
      }
      return out
    }

    async function processOne(equipmentData: any) {
      const {
        id,
        name,
        slot,
        rarity,
        src,
        alt,
        // pass-through; we'll resolve to IDs below, supporting name-based inputs too
        attributes,
        iconic,
        materials,
      } = equipmentData;

      if (!name || !slot || !rarity || !src) {
        throw new Error('Missing required fields: name, slot, rarity, src')
      }

      // Resolve nested arrays to ID-based references, auto-creating masters when needed
      const resolvedAttributes = await resolveAttributesArray(equipmentData, { iconic: false })
      const resolvedIconic = await resolveAttributesArray(equipmentData, { iconic: true })
      const resolvedMaterials = await resolveMaterialsArray(equipmentData)

      if (id) {
        const hasAttrsInput = Array.isArray((equipmentData as any)?.attributes) || Array.isArray((equipmentData as any)?.attributesByName)
        const hasIconicInput = Array.isArray((equipmentData as any)?.iconic) || Array.isArray((equipmentData as any)?.iconicByName)
        const hasMaterialsInput = Array.isArray((equipmentData as any)?.materials) || Array.isArray((equipmentData as any)?.materialsByName)

        const attributesData = resolvedAttributes.map((attr) => ({
          where: { equipmentId_attributeId: { equipmentId: id, attributeId: attr.attributeId } },
          create: { attributeId: attr.attributeId, value: attr.value ?? null },
          update: { value: attr.value ?? null },
        }));
  const iconicData = resolvedIconic.map((iconicAttr) => ({
          where: { equipmentId_attributeId: { equipmentId: id, attributeId: iconicAttr.attributeId } },
          create: { attributeId: iconicAttr.attributeId, value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
          update: { value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
        }));
  const materialsData = resolvedMaterials.map((material) => ({
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

        const relationUpdates: any = {}
        if (hasAttrsInput) {
          relationUpdates.attributes = {
            upsert: attributesData,
            deleteMany: { attributeId: { notIn: resolvedAttributes.map((a) => a.attributeId) } },
          }
        }
        if (hasIconicInput) {
          relationUpdates.iconic = {
            upsert: iconicData,
            deleteMany: { attributeId: { notIn: resolvedIconic.map((i) => i.attributeId) } },
          }
        }
        if (hasMaterialsInput) {
          relationUpdates.materials = {
            upsert: materialsData,
            deleteMany: { materialId: { notIn: resolvedMaterials.map((m) => m.materialId) } },
          }
        }

        return prisma.equipment.update({
          where: { id },
          data: {
            name,
            slot,
            rarity,
            src,
            alt,
            updatedAt: new Date(),
            ...relationUpdates,
          },
        });
      } else {
        const existingEquipmentByName = await prisma.equipment.findFirst({ where: { name } });
        if (existingEquipmentByName) {
          const hasAttrsInput = Array.isArray((equipmentData as any)?.attributes) || Array.isArray((equipmentData as any)?.attributesByName)
          const hasIconicInput = Array.isArray((equipmentData as any)?.iconic) || Array.isArray((equipmentData as any)?.iconicByName)
          const hasMaterialsInput = Array.isArray((equipmentData as any)?.materials) || Array.isArray((equipmentData as any)?.materialsByName)

          const relationUpdates: any = {}
          if (hasAttrsInput) {
            relationUpdates.attributes = {
              upsert: resolvedAttributes.map((attr) => ({
                where: { equipmentId_attributeId: { equipmentId: existingEquipmentByName.id, attributeId: attr.attributeId } },
                create: { attributeId: attr.attributeId, value: attr.value ?? null },
                update: { value: attr.value ?? null },
              })),
              deleteMany: { attributeId: { notIn: resolvedAttributes.map((a) => a.attributeId) } },
            }
          }
          if (hasIconicInput) {
            relationUpdates.iconic = {
              upsert: resolvedIconic.map((iconicAttr) => ({
                where: { equipmentId_attributeId: { equipmentId: existingEquipmentByName.id, attributeId: iconicAttr.attributeId } },
                create: { attributeId: iconicAttr.attributeId, value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
                update: { value: iconicAttr.value ?? null, tier: iconicAttr.tier ?? null },
              })),
              deleteMany: { attributeId: { notIn: resolvedIconic.map((i) => i.attributeId) } },
            }
          }
          if (hasMaterialsInput) {
            relationUpdates.materials = {
              upsert: resolvedMaterials.map((material) => ({
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
              deleteMany: { materialId: { notIn: resolvedMaterials.map((m) => m.materialId) } },
            }
          }

          return prisma.equipment.update({
            where: { id: existingEquipmentByName.id },
            data: {
              slot,
              rarity,
              src,
              alt,
              updatedAt: new Date(),
              ...relationUpdates,
            },
          });
        }
        return prisma.equipment.create({
          data: {
            name,
            slot,
            rarity,
            src,
            alt,
            attributes: {
              create: resolvedAttributes.map((a) => ({
                attribute: { connect: { id: a.attributeId } },
                value: a.value ?? null,
              })),
            },
            iconic: {
              create: resolvedIconic.map((i) => ({
                attribute: { connect: { id: i.attributeId } },
                value: i.value ?? null,
                tier: i.tier ?? null,
              })),
            },
            materials: {
              create: resolvedMaterials.map((m) => ({
                material: { connect: { id: m.materialId } },
                rarity: m.rarity ?? null,
                quantity: m.quantity ?? 1,
              })),
            },
          },
        });
      }
    }

    const results: any[] = [];
    const serverBatch = 5;
    for (let i = 0; i < equipments.length; i += serverBatch) {
      const slice = equipments.slice(i, i + serverBatch);
      const sliceResults = await Promise.all(slice.map((e) => processOne(e)));
      results.push(...sliceResults.filter(Boolean));
    }

    // Return a single object if input was single, else array of results
    return NextResponse.json(
      {
  message: results.length === 1 ? 'Equipment saved' : `${results.length} equipment items processed`,
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

// === DELETE: Remove equipment and dependent relations ===
export async function DELETE(request: NextRequest) {
  const session = await AccessControlService.getSessionInfo(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!AccessControlService.canWrite(session.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const name = searchParams.get('name');

  try {
    // Resolve equipment by id or name
    const existing = await prisma.equipment.findFirst({ where: id ? { id } : { name: name! } });
    if (!existing) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.equipmentAttribute.deleteMany({ where: { equipmentId: existing.id } }),
      prisma.equipmentIconicAttribute.deleteMany({ where: { equipmentId: existing.id } }),
      prisma.equipmentMaterial.deleteMany({ where: { equipmentId: existing.id } }),
      prisma.playerEquipment.deleteMany({ where: { equipmentId: existing.id } }),
      prisma.applicationEquipment.deleteMany({ where: { equipmentId: existing.id } }),
      prisma.equipment.delete({ where: { id: existing.id } }),
    ]);

    return NextResponse.json({ message: 'Equipment deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/equipment error:', error);
    return NextResponse.json({ message: 'Failed to delete equipment', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}