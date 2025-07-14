import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prismaUtils';
import { AccessControlService } from '@/services/AccessControlService/index';
import { UserRole } from '@prisma/client';

const allowedRoles = [UserRole.ADMIN, UserRole.SYSTEM, UserRole.KINGDOM_MEMBER];
const acs = new AccessControlService(allowedRoles);

interface UpdatePayload {
  firstName?: string,
  lastName?: string,
  unsafeMetadata?: UserUnsafeMetadata,
  publicMetadata?: UserPublicMetadata
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const unauthorized = await acs.requireReadAccess(req);
  if (unauthorized) {
    return unauthorized; // Returns 401 or 403
  }

  const { userId } = await params;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ message: 'Bad Request: Invalid user ID provided' }, { status: 400 });
  }
  const clerk = await clerkClient();

  // Fetch Clerk user data
  try {
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(userId);
    } catch (error: any) {
      if (error && error.status === 404) {
        console.warn(`Clerk user with ID ${userId} not found.`);
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      // For any other unexpected Clerk API error
      console.error(`Clerk API error for userId ${userId}:`, error);
      return NextResponse.json(
        { message: 'Failed to retrieve user data from authentication service' },
        { status: 500 }
      );
    }

    const appUserWithPlayer = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        player: {
          include: {
            alliance: { select: { id: true, name: true, tag: true } },
            stats: {
              select: {
                snapshot: true,
                killPoints: true,
                t4Kills: true,
                t5Kills: true,
                t45Kills: true,
                deaths: true,
                power: true,
              },
              orderBy: { snapshot: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!appUserWithPlayer) {
      console.warn(`Application user data for Clerk ID ${userId} not found.`);
      return NextResponse.json(
        { message: 'User profile not found in application database' },
        { status: 404 }
      );
    }

    const player = appUserWithPlayer.player;

    return NextResponse.json({
      user: clerkUser,
      player: player
        ? {
            id: player.id,
            name: player.name,
            rokId: player.rokId,
            isMigrant: player.isMigrant,
            dateMigrated: player.dateMigrated,
            dateMigratedOut: player.dateMigratedOut,
            userIdVerified: player.userIdVerified,
            alliance: player.alliance ?? null,
            stats: player.stats[0] ?? null,
          }
        : null, 
    });

  } catch (error) {
    console.error(`An unexpected error occurred in /users/[userId] GET for ${userId}:`, error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const unauthorized = await acs.requireWriteAccess(req);
  if (unauthorized) {
    return unauthorized;
  }

  const { userId } = params;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ message: 'Bad Request: Invalid user ID provided' }, { status: 400 });
  }

  const clerk = await clerkClient();

  try {
    const body = await req.json();
    const { firstName, lastName, socials } = body;

    // Validate incoming data structure for direct Clerk fields
    if (firstName !== undefined && typeof firstName !== 'string') {
      return NextResponse.json({ message: 'Bad Request: firstName must be a string' }, { status: 400 });
    }
    if (lastName !== undefined && typeof lastName !== 'string') {
      return NextResponse.json({ message: 'Bad Request: lastName must be a string' }, { status: 400 });
    }
    if (socials !== undefined && (typeof socials !== 'object' || socials === null || Array.isArray(socials))) {
      return NextResponse.json({ message: 'Bad Request: socials must be an object' }, { status: 400 });
    }

    let existingClerkUser;
    try {
      existingClerkUser = await clerk.users.getUser(userId);
    } catch (error: any) {
      if (error && error.status === 404) {
        console.warn(`Clerk user with ID ${userId} not found for update.`);
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      console.error(`Clerk API error fetching user ${userId} for update:`, error);
      return NextResponse.json(
        { message: 'Failed to retrieve existing user data from authentication service' },
        { status: 500 }
      );
    }

    // 5. Construct the update payload for Clerk.
    const updatePayload: UpdatePayload = {};

    if (firstName !== undefined) {
      updatePayload.firstName = firstName;
    }
    if (lastName !== undefined) {
      updatePayload.lastName = lastName;
    }

    // Handle unsafeMetadata for socials: Merge new socials with existing ones.
    if (socials !== undefined) {
      const currentUnsafeMetadata = existingClerkUser.unsafeMetadata || {};
      const currentSocials = (currentUnsafeMetadata as any).socials || {}; // Type assertion for dynamic access
      
      const newSocials = { ...currentSocials, ...socials };
      
      updatePayload.unsafeMetadata = {
        ...currentUnsafeMetadata,
        socials: newSocials,
      };
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ message: 'Bad Request: No valid fields provided for update' }, { status: 400 });
    }

    // 6. Call Clerk's updateUser API.
    const updatedClerkUser = await clerk.users.updateUser(userId, updatePayload);

    // 7. Return the updated user data.
    // You might want to select specific fields to return, similar to your GET method.
    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedClerkUser.id,
        firstName: updatedClerkUser.firstName,
        lastName: updatedClerkUser.lastName,
        emailAddresses: updatedClerkUser.emailAddresses,
        imageUrl: updatedClerkUser.imageUrl,
        unsafeMetadata: updatedClerkUser.unsafeMetadata, // Include updated unsafeMetadata
        // Add other relevant fields you want to expose
      },
    });

  } catch (error: any) {
    // 8. Comprehensive Error Handling for Clerk API and other issues.
    if (error) {
      console.error(`Clerk API error during user update for ${userId}:`, error.errors);
      // Clerk often provides detailed errors in error.errors array
      const errorMessage = error.errors?.[0]?.message || 'Failed to update user via Clerk API.';
      const statusCode = error.status || 500;
      return NextResponse.json({ message: errorMessage }, { status: statusCode });
    } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
      // Handle malformed JSON body
      return NextResponse.json({ message: 'Bad Request: Invalid JSON body' }, { status: 400 });
    } else {
      // Catch any other unexpected errors
      console.error(`An unexpected error occurred in /users/[userId] POST for ${userId}:`, error);
      return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
  }
}