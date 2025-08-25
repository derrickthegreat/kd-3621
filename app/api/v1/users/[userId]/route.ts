import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prismaUtils";
import { AccessControlService } from "@/services/AccessControlService/index"; // Assuming this path is correct
import { logUserAction } from "@/lib/db/audit";
import { UserRole } from "@prisma/client";

// Placeholder types for Clerk's metadata.
// You should replace these with your actual defined types if they exist elsewhere.
export interface UserUnsafeMetadata {
  socials?: Record<string, string>;
  // Add other unsafe metadata properties here
  [key: string]: any;
}

export interface UserPublicMetadata {
  // Add public metadata properties here
  [key: string]: any;
}

export interface UpdatePayload {
  firstName?: string;
  lastName?: string;
  socials?: Record<string, string>;
  avatarUrl?: string | null;
  unsafeMetadata?: UserUnsafeMetadata;
  publicMetadata?: UserPublicMetadata;
}

// Instantiate AccessControlService for GET requests
const getAcs = new AccessControlService([
  UserRole.ADMIN,
  UserRole.SYSTEM,
  UserRole.KINGDOM_MEMBER,
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // Explicitly define params type
) {
  // Access control check
  const unauthorized = await getAcs.requireReadAccess(req);
  if (unauthorized) {
    return unauthorized;
  }

  // Session info (if needed for logging or further checks, though not used in original GET logic)
  // const session = await getAcs.getSessionInfo(req);

  if (!params) {
    return NextResponse.json(
      { message: "Bad Request: Invalid user ID provided" },
      { status: 400 }
    );
  }

  let { userId: targetUserId } = await params; // params is already an object, no need for await params
  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json(
      { message: "Bad Request: Invalid user ID provided" },
      { status: 400 }
    );
  }

  try {
    const clerk = await clerkClient();
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(targetUserId);
    } catch (error: any) {
      if (error && error.status === 404) {
        console.warn(`Clerk user with ID ${targetUserId} not found.`);
        return NextResponse.json(
          { message: "User not found in authentication service" },
          { status: 404 }
        );
      }
      console.error(`Clerk API error fetching user ${targetUserId}:`, error);
      return NextResponse.json(
        { message: "Failed to retrieve user data from authentication service" },
        { status: 500 }
      );
    }

    const appUserWithPlayers = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
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
      console.warn(`Application user data for Clerk ID ${targetUserId} not found.`);
      return NextResponse.json(
        { message: "User profile not found in application database" },
        { status: 404 }
      );
    }

    const players = appUserWithPlayers.governors
      .map((up) => up.player)
      .filter(Boolean);

    console.log("Retrieved Players count for target user:", players.length);

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      `An unexpected error occurred in /users/[userId] GET for ${targetUserId}:`,
      error
    );
    return NextResponse.json(
      { message: "An internal server error occurred" },
      { status: 500 }
    );
  }
}

// Instantiate AccessControlService for POST requests
const postAcs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // Explicitly define params type
) {
  // Access control check
  const unauthorized = await postAcs.requireWriteAccess(req);
  if (unauthorized) {
    return unauthorized;
  }

  // Session info (if needed for logging or further checks)
  // const session = await postAcs.getSessionInfo(req);

  const { userId: targetUserId } = await params; // params is already an object, no need for await params

  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json(
      { message: "Bad Request: Invalid user ID provided" },
      { status: 400 }
    );
  }

  const clerk = await clerkClient();

  try {
  const raw = await req.json();
  const body: UpdatePayload = raw;
  const { firstName, lastName, socials, avatarUrl, publicMetadata } = body;
  const displayName: string | null | undefined = (raw as any).displayName;
  const username: string | null | undefined = (raw as any).username;
  const commanderAvatarId: string | null | undefined = (raw as any).commanderAvatarId;

    // 1. Validate incoming data types
    if (firstName !== undefined && typeof firstName !== "string") {
      return NextResponse.json(
        { message: "Bad Request: firstName must be a string" },
        { status: 400 }
      );
    }
    if (lastName !== undefined && typeof lastName !== "string") {
      return NextResponse.json(
        { message: "Bad Request: lastName must be a string" },
        { status: 400 }
      );
    }
    if (
      socials !== undefined &&
      (typeof socials !== "object" || socials === null || Array.isArray(socials))
    ) {
      return NextResponse.json(
        { message: "Bad Request: socials must be an object" },
        { status: 400 }
      );
    }
    if (
      avatarUrl !== undefined &&
      avatarUrl !== null &&
      typeof avatarUrl !== "string"
    ) {
      return NextResponse.json(
        { message: "Bad Request: avatarUrl must be a string or null" },
        { status: 400 }
      );
    }
    if (displayName !== undefined && displayName !== null && typeof displayName !== 'string') {
      return NextResponse.json({ message: 'Bad Request: displayName must be a string or null' }, { status: 400 });
    }
    if (username !== undefined && username !== null && typeof username !== 'string') {
      return NextResponse.json({ message: 'Bad Request: username must be a string or null' }, { status: 400 });
    }
    if (username !== undefined) {
      const u = (username || '').trim();
      if (!u) return NextResponse.json({ message: 'Username is required' }, { status: 400 });
      if (/\s/.test(u)) return NextResponse.json({ message: 'Username cannot contain spaces' }, { status: 400 });
    }
    if (commanderAvatarId !== undefined && commanderAvatarId !== null && typeof commanderAvatarId !== 'string') {
      return NextResponse.json({ message: 'Bad Request: commanderAvatarId must be a string or null' }, { status: 400 });
    }

    // 2. Fetch the existing Clerk user to merge metadata safely
    let existingClerkUser;
    try {
      existingClerkUser = await clerk.users.getUser(targetUserId);
    } catch (error: any) {
      if (error && error.status === 404) {
        console.warn(`Clerk user with ID ${targetUserId} not found for update.`);
        return NextResponse.json(
          { message: "User not found in authentication service" },
          { status: 404 }
        );
      }
      console.error(
        `Clerk API error fetching user ${targetUserId} for update:`,
        error
      );
      return NextResponse.json(
        { message: "Failed to retrieve existing user data from authentication service" },
        { status: 500 }
      );
    }

    // 3. Construct the update payload for Clerk using UserUpdateParams
  const updatePayload: UpdatePayload = {};
    let hasUpdates = false;

    // Direct Clerk fields
    if (firstName !== undefined) {
      updatePayload.firstName = firstName;
      hasUpdates = true;
    }
    if (lastName !== undefined) {
      updatePayload.lastName = lastName;
      hasUpdates = true;
    }
    if (avatarUrl !== undefined) {
      updatePayload.avatarUrl = avatarUrl;
      hasUpdates = true;
    }

  // App profile updates (DB)
  let appHasUpdates = false;
  const appData: any = {};
  if (displayName !== undefined) { appData.displayName = displayName?.trim() || null; appHasUpdates = true; }
  if (username !== undefined) { appData.username = (username || '').trim(); appHasUpdates = true; }
  if (avatarUrl !== undefined) { appData.avatarUrl = avatarUrl; appHasUpdates = true; }
  if (commanderAvatarId !== undefined) { appData.commanderAvatarId = commanderAvatarId; appHasUpdates = true; }

    // Handle unsafeMetadata merging
    const currentUnsafeMetadata: UserUnsafeMetadata =
      existingClerkUser.unsafeMetadata || {};
    let newUnsafeMetadata: UserUnsafeMetadata = { ...currentUnsafeMetadata };

    // Merge socials into unsafeMetadata
    if (socials !== undefined) {
      const currentSocials = (currentUnsafeMetadata as any).socials || {};
      const mergedSocials = { ...currentSocials, ...socials };
      if (JSON.stringify(currentSocials) !== JSON.stringify(mergedSocials)) {
        newUnsafeMetadata = { ...newUnsafeMetadata, socials: mergedSocials };
        hasUpdates = true;
      }
    }

    // Handle other unsafeMetadata fields passed directly via body.unsafeMetadata
    if (body.unsafeMetadata !== undefined) {
      const mergedUnsafeMetadata = { ...newUnsafeMetadata, ...body.unsafeMetadata };
      if (JSON.stringify(newUnsafeMetadata) !== JSON.stringify(mergedUnsafeMetadata)) {
        newUnsafeMetadata = mergedUnsafeMetadata;
        hasUpdates = true;
      }
    }

    if (hasUpdates || Object.keys(newUnsafeMetadata).length > 0) {
      // Only assign if `newUnsafeMetadata` is actually different or non-empty
      // and we have other updates or the metadata itself is the update.
      if (JSON.stringify(currentUnsafeMetadata) !== JSON.stringify(newUnsafeMetadata)) {
        updatePayload.unsafeMetadata = newUnsafeMetadata;
        hasUpdates = true;
      }
    }

    // Handle publicMetadata updates
    if (publicMetadata !== undefined) {
      updatePayload.publicMetadata = publicMetadata;
      hasUpdates = true;
    }

    // If no valid fields were provided or no actual changes detected
    if (!hasUpdates && Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { message: "Bad Request: No valid fields provided for update or no changes detected" },
        { status: 400 }
      );
    }

    // 4. Call Clerk's updateUser API
    const updatedClerkUser = await clerk.users.updateUser(
      targetUserId,
      updatePayload
    );

    // Apply app profile updates in our DB
    if (appHasUpdates) {
      try {
        if (appData.username) {
          const exists = await prisma.user.findFirst({ where: { username: appData.username, clerkId: { not: targetUserId } }, select: { id: true } });
          if (exists) return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
        }
        if (appData.displayName) {
          const existsDn = await prisma.user.findFirst({ where: { displayName: appData.displayName, clerkId: { not: targetUserId } }, select: { id: true } });
          if (existsDn) return NextResponse.json({ message: 'Display name is already taken' }, { status: 409 });
        }
        await prisma.user.update({ where: { clerkId: targetUserId }, data: appData });
      } catch (e: any) {
        // If DB is down (P1001), still return Clerk update result
        if (e?.code !== 'P1001') throw e;
      }
    }

    // Audit log (actor is the admin/system performing the update, subject is the target user)
    const session = await postAcs.getSessionInfo(req);
  await logUserAction({
      action: `Updated user profile fields (${Object.keys(updatePayload).join(', ')})`,
      actorClerkId: session?.userId ?? null,
      targetClerkId: targetUserId,
    });

    // 5. Return the updated user data
    return NextResponse.json(
      {
        message: "User updated successfully",
        user: {
          id: updatedClerkUser.id,
          firstName: updatedClerkUser.firstName,
          lastName: updatedClerkUser.lastName,
          emailAddresses: updatedClerkUser.emailAddresses.map(
            (ea) => ea.emailAddress
          ),
          imageUrl: updatedClerkUser.imageUrl,
          unsafeMetadata: updatedClerkUser.unsafeMetadata,
          publicMetadata: updatedClerkUser.publicMetadata,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error) {
      console.error(
        `Clerk API error during user update for ${targetUserId}:`,
        error.errors
      );
      const errorMessage =
        error.errors?.[0]?.message || "Failed to update user via Clerk API.";
      const statusCode = error.status || 500;
      return NextResponse.json({ message: errorMessage }, { status: statusCode });
    } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { message: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    } else {
      console.error(
        `An unexpected error occurred in /users/[userId] POST for ${targetUserId}:`,
        error
      );
      return NextResponse.json(
        { message: "An internal server error occurred" },
        { status: 500 }
      );
    }
  }
}