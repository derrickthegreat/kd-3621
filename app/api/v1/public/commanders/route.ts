import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prismaUtils';

/**
 * API Endpoint: /api/v1/public/commanders
 * 
 * Public endpoint to fetch commanders with their skill trees for the builds page
 * No authentication required as this is public data
 */
export async function GET(request: NextRequest) {
  try {
    const commanders = await prisma.commander.findMany({
      where: {
        isArchived: false,
      },
      include: {
        skillTrees: {
          select: {
            id: true,
            name: true,
            url: true,
            rating: true,
            description: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match the expected format from commanders.json
    const transformedCommanders = commanders.map(commander => ({
      id: commander.id,
      name: commander.name,
      image: commander.iconUrl,
      rarity: commander.rarity || 'Common',
      attributes: commander.speciality || [],
      builds: commander.skillTrees.map(skillTree => ({
        id: skillTree.id,
        name: skillTree.name,
        image: skillTree.url,
        rating: skillTree.rating,
        description: skillTree.description,
      })),
    }));

    return NextResponse.json(transformedCommanders, { status: 200 });
  } catch (error) {
    console.error('Error fetching commanders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch commanders' },
      { status: 500 }
    );
  }
}
