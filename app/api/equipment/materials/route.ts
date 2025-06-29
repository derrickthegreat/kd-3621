import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define interface for the expected request body for adding a material
interface AddMaterialRequestBody {
  name: string;
  description?: string;
}

// Define the GET handler for the API route to fetch all materials
export async function GET(request: NextRequest) {
  try {
    const materials = await prisma.material.findMany({
      orderBy: {
        name: 'asc', // Order by name alphabetically
      },
      select: { // Explicitly select fields if not all scalar fields are needed
        id: true,
        name: true,
        description: true,
        // createdAt is included by default if not excluded, but can be added if needed
      }
    });
    return NextResponse.json(materials, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message || 'Something went wrong.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Define the POST handler for the API route to add a new material
export async function POST(request: NextRequest) {
  try {
    const { name, description }: AddMaterialRequestBody = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Bad Request', error: 'Material name is required.' }, { status: 400 });
    }

    const newMaterial = await prisma.material.create({
      data: {
        name,
        description,
      },
    });
    return NextResponse.json({ message: 'Material added successfully', material: newMaterial }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding material:', error);
    if (error.code === 'P2002') { // Unique constraint violation
      return NextResponse.json({ message: 'Conflict', error: 'Material with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal Server Error', error: error.message || 'Something went wrong.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
