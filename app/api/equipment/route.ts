import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Slot, Rarity } from '@/lib/types/equipment';

const prisma = new PrismaClient();

// Define interfaces to match the frontend's EquipmentFormData structure
interface EquipmentNormalAttributeForm {
  attributeId: string;
  value: string;
}

interface EquipmentIconicAttributeForm {
  attributeId: string;
  value: string;
  tier: number;
}

interface EquipmentMaterialForm {
  materialId: string;
  quantity: number;
}

interface AddEquipmentRequestBody {
  name: string;
  slot: Slot;
  rarity: Rarity;
  src: string;
  alt: string;
  normalAttributes: EquipmentNormalAttributeForm[];
  iconicAttributes: EquipmentIconicAttributeForm[];
  materials: EquipmentMaterialForm[];
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      slot,
      rarity,
      src,
      alt,
      normalAttributes,
      iconicAttributes,
      materials,
    }: AddEquipmentRequestBody = await request.json();

    // Basic validation
    if (!name || !slot || !rarity || !src || !alt) {
      return NextResponse.json({ message: 'Bad Request', error: 'Missing required equipment fields.' }, { status: 400 });
    }

    // Prisma transaction to ensure all related data is created or none is
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the main Equipment record
      const newEquipment = await tx.equipment.create({
        data: {
          name,
          slot,
          rarity,
          src,
          alt,
        },
      });

      // 2. Create Normal Attributes for the Equipment
      if (normalAttributes && normalAttributes.length > 0) {
        // Filter out any attributes that don't have an ID selected
        const validNormalAttributes = normalAttributes.filter(attr => attr.attributeId);
        if (validNormalAttributes.length > 0) {
            await tx.equipmentAttribute.createMany({
                data: validNormalAttributes.map((attr) => ({
                    equipmentId: newEquipment.id,
                    attributeId: attr.attributeId,
                    value: attr.value,
                })),
            });
        }
      }

      // 3. Create Iconic Attributes for the Equipment (only if rarity is LEGENDARY)
      if (rarity === Rarity.LEGENDARY && iconicAttributes && iconicAttributes.length > 0) {
        // Filter out any iconic attributes that don't have an ID selected
        const validIconicAttributes = iconicAttributes.filter(attr => attr.attributeId);
        if (validIconicAttributes.length > 0) {
            await tx.equipmentIconicAttribute.createMany({
                data: validIconicAttributes.map((attr) => ({
                    equipmentId: newEquipment.id,
                    attributeId: attr.attributeId,
                    value: attr.value,
                    tier: attr.tier,
                })),
            });
        }
      }

      // 4. Create Materials for the Equipment
      if (materials && materials.length > 0) {
        // Filter out any materials that don't have an ID selected and have a quantity > 0
        const validMaterials = materials.filter(mat => mat.materialId && mat.quantity > 0);
        if (validMaterials.length > 0) {
            await tx.equipmentMaterial.createMany({
                data: validMaterials.map((mat) => ({
                    equipmentId: newEquipment.id,
                    materialId: mat.materialId,
                    quantity: mat.quantity,
                })),
            });
        }
      }

      return newEquipment; // Return the created equipment
    });

    return NextResponse.json({ message: 'Equipment added successfully', equipment: result }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding equipment:', error);
    // Handle specific Prisma errors if necessary, e.g., unique constraint violation for equipment name
    if (error.code === 'P2002') { // Unique constraint violation (e.g., equipment name)
        return NextResponse.json({ message: 'Conflict', error: 'Equipment with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal Server Error', error: error.message || 'Something went wrong.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
