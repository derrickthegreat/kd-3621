import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prismaUtils";
import { AccessControlService } from "@/services/AccessControlService/index"; // Assuming this path is correct
import { UserRole } from "@prisma/client";

// Placeholder types for Clerk's metadata.
// You should replace these with your actual defined types if they exist elsewhere.
export interface UserUnsafeMetadata {
  birthday?: string; // Example field
  socials?: Record<string, string>;
  profileColor?: string; // Example field
  [key: string]: any; // Allow other properties
}

// Instantiate AccessControlService for GET requests
const getAcs = new AccessControlService([
  UserRole.ADMIN,
  UserRole.SYSTEM,
  UserRole.KINGDOM_MEMBER,
]);

export async function GET(req: NextRequest) {
  // Access control check
  const unauthorized = await getAcs.requireReadAccess(req);
  if (unauthorized) {
    return unauthorized;
  }

  // Get session info to obtain the authenticated user's ID
  const session = await getAcs.getSessionInfo(req);
  if (!session || !session.userId) {
    // This case should ideally be caught by requireReadAccess, but as a safeguard
    return NextResponse.json(
      { message: "Authentication Required or User ID Missing" },
      { status: 401 }
    );
  }

  const authenticatedUserId = session.userId;

  try {
    const clerk = await clerkClient();
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(authenticatedUserId);
    } catch (error: any) {
      if (error && error.status === 404) {
        console.warn(`Clerk user with ID ${authenticatedUserId} not found.`);
        return NextResponse.json(
          { message: "User not found in authentication service" },
          { status: 404 }
        );
      }
      console.error(
        `Clerk API error fetching user ${authenticatedUserId}:`,
        error
      );
      return NextResponse.json(
        { message: "Failed to retrieve user data from authentication service" },
        { status: 500 }
      );
    }

    const appUserWithPlayers = await prisma.user.findUnique({
      where: { clerkId: authenticatedUserId },
      include: {
        governors: {
          include: {
            player: {
              include: {
                alliance: {
                  select: {
                    id: true,
                    name: true,
                    tag: true,
                  },
                },
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
                  orderBy: {
                    snapshot: "desc",
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!appUserWithPlayers) {
      console.warn(
        `Application user for Clerk ID ${authenticatedUserId} not found in DB, despite session.`
      );
      return NextResponse.json(
        { message: "User profile not found in application database" },
        { status: 404 }
      );
    }

    const players = appUserWithPlayers.governors
      .map((up) => up.player)
      .filter(Boolean);

    console.log("Retrieved Players count:", players.length);

    return NextResponse.json({
      user: clerkUser,
      governors: players.map((player) => ({
        id: player.id,
        name: player.name,
        rokId: player.rokId,
        isMigrant: player.isMigrant,
        dateMigrated: player.dateMigrated,
        dateMigratedOut: player.dateMigratedOut,
        alliance: player.alliance ?? null,
        stats: player.stats.length > 0 ? player.stats[0] : null,
      })),
    });
  } catch (error: any) {
    if (error) {
      console.error(
        `Clerk API error getting user ${authenticatedUserId}:`,
        error.errors
      );
      const errorMessage =
        error.errors?.[0]?.message || "Failed to retrieve user data from Clerk.";
      return NextResponse.json(
        { message: errorMessage },
        { status: error.status || 500 }
      );
    } else {
      console.error(
        `An unexpected error occurred in /me GET for user ${authenticatedUserId}:`,
        error
      );
      return NextResponse.json(
        { message: "An internal server error occurred" },
        { status: 500 }
      );
    }
  }
}

// Instantiate AccessControlService for POST requests
const postAcs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);

export async function POST(req: NextRequest) {
  // Access control check
  const unauthorized = await postAcs.requireWriteAccess(req);
  if (unauthorized) {
    return unauthorized;
  }

  // Get session info to obtain the authenticated user's ID
  const session = await postAcs.getSessionInfo(req);
  if (!session || !session.userId) {
    // This case should ideally be caught by requireWriteAccess, but as a safeguard
    return NextResponse.json(
      { message: "Authentication Required or User ID Missing" },
      { status: 401 }
    );
  }

  const authenticatedUserId = session.userId;

  const clerk = await clerkClient();

  try {
    const body = await req.json();
    // Define a type for the updates payload to Clerk for better type safety
    interface ClerkUpdatePayload {
      firstName?: string;
      lastName?: string;
      imageUrl?: string | null;
      unsafeMetadata?: UserUnsafeMetadata;
    }
    const updates: ClerkUpdatePayload = {};

    const existingClerkUser = await clerk.users.getUser(authenticatedUserId); // Fetch existing user here
    const currentUnsafeMetadata: UserUnsafeMetadata =
      existingClerkUser.unsafeMetadata || {};
    let updatedUnsafeMetadata: UserUnsafeMetadata = { ...currentUnsafeMetadata };

    if (body.birthday !== undefined) {
      updatedUnsafeMetadata = {
        ...updatedUnsafeMetadata,
        birthday: body.birthday,
      };
    }
    if (
      body.socials !== undefined &&
      typeof body.socials === "object" &&
      body.socials !== null &&
      !Array.isArray(body.socials) // Added check for array
    ) {
      const currentSocials = (currentUnsafeMetadata as any).socials || {};
      updatedUnsafeMetadata = {
        ...updatedUnsafeMetadata,
        socials: { ...currentSocials, ...body.socials },
      };
    }
    if (body.profileColor !== undefined) {
      updatedUnsafeMetadata = {
        ...updatedUnsafeMetadata,
        profileColor: body.profileColor,
      };
    }

    // Only assign if there are actual changes to metadata
    // Compare stringified versions to detect deep changes in objects
    if (JSON.stringify(currentUnsafeMetadata) !== JSON.stringify(updatedUnsafeMetadata)) {
      updates.unsafeMetadata = updatedUnsafeMetadata;
    }


    if (body.avatarUrl !== undefined) { // Removed typeof check to allow null
      updates.imageUrl = body.avatarUrl;
    }

    if (body.firstName !== undefined && typeof body.firstName === "string") {
      updates.firstName = body.firstName;
    }
    if (body.lastName !== undefined && typeof body.lastName === "string") {
      updates.lastName = body.lastName;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "Bad Request: No valid fields provided for update or no changes detected" },
        { status: 400 }
      );
    }

    const updatedUser = await clerk.users.updateUser(authenticatedUserId, updates);

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        emailAddresses: updatedUser.emailAddresses.map(ea => ea.emailAddress), // Map to string array
        imageUrl: updatedUser.imageUrl,
        unsafeMetadata: updatedUser.unsafeMetadata,
      },
    });
  } catch (error: any) {
    if (error) {
      console.error(
        `Clerk API error during user update for ${authenticatedUserId}:`,
        error.errors
      );
      const errorMessage =
        error.errors?.[0]?.message || "Failed to update user via Clerk API.";
      return NextResponse.json(
        { message: errorMessage },
        { status: error.status || 500 }
      );
    } else if (
      error instanceof SyntaxError &&
      error.message.includes("JSON")
    ) {
      return NextResponse.json(
        { message: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    } else {
      console.error(
        `An unexpected error occurred in /me POST for user ${authenticatedUserId}:`,
        error
      );
      return NextResponse.json(
        { message: "An internal server error occurred" },
        { status: 500 }
      );
    }
  }
}
