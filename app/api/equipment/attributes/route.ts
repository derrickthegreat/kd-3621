import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define interface for the expected request body for adding an attribute
interface AddAttributeRequestBody {
  name: string;
  description?: string;
  // tier?: number; // Removed as per schema update
  isIconic?: boolean;
}

// Define the GET handler for the API route to fetch all attributes
export async function GET(request: NextRequest) {
  try {
    const attributes = await prisma.attribute.findMany({
      orderBy: {
        name: 'asc', // Order by name alphabetically
      },
      select: {
        id: true,
        name: true,
        description: true,
        isIconic: true, // Include isIconic in the fetched data
      }
    });
    return NextResponse.json(attributes, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message || 'Something went wrong.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Define the POST handler for the API route to add a new attribute
export async function POST(request: NextRequest) {
  try {
    const { name, description, isIconic }: AddAttributeRequestBody = await request.json(); // Removed tier from destructuring

    if (!name) {
      return NextResponse.json({ message: 'Bad Request', error: 'Attribute name is required.' }, { status: 400 });
    }

    const newAttribute = await prisma.attribute.create({
      data: {
        name,
        description,
        isIconic: isIconic ?? false, // Default to false if not provided
      },
    });
    return NextResponse.json({ message: 'Attribute added successfully', attribute: newAttribute }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding attribute:', error);
    if (error.code === 'P2002') { // Unique constraint violation
      return NextResponse.json({ message: 'Conflict', error: 'Attribute with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal Server Error', error: error.message || 'Something went wrong.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

