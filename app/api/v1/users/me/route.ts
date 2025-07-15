import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prismaUtils";
import { clerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { withAccessControl } from "@/lib/middleware/withAccessControl";

const allowedRoles = [UserRole.ADMIN, UserRole.SYSTEM, UserRole.KINGDOM_MEMBER];

export const GET = withAccessControl(
  allowedRoles,
  async (req: NextRequest, { params }, session) => {
    const clerk = await clerkClient();
    try {
      const clerkUser = await clerk.users.getUser(session.userId);

      const appUserWithPlayers = await prisma.user.findUnique({
        where: { clerkId: session.userId },
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
          `Application user for Clerk ID ${session.userId} not found in DB, despite session.`
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
          `Clerk API error getting user ${session.userId}:`,
          error.errors
        );
        const errorMessage =
          error.errors?.[0]?.message ||
          "Failed to retrieve user data from Clerk.";
        return NextResponse.json(
          { message: errorMessage },
          { status: error.status || 500 }
        );
      } else {
        console.error(
          `An unexpected error occurred in /me GET for user ${session.userId}:`,
          error
        );
        return NextResponse.json(
          { message: "An internal server error occurred" },
          { status: 500 }
        );
      }
    }
  }
);

export const POST = withAccessControl(
  allowedRoles,
  async (req: NextRequest, { params }, session) => {
    const clerk = await clerkClient();
    const existingClerkUser = await clerk.users.getUser(session.userId);

    try {
      const body = await req.json();
      const updates: UserUnsafeMetadata = {};

      const currentUnsafeMetadata = existingClerkUser.unsafeMetadata || {};
      let updatedUnsafeMetadata = { ...currentUnsafeMetadata };

      if (body.birthday !== undefined) {
        updatedUnsafeMetadata = {
          ...updatedUnsafeMetadata,
          birthday: body.birthday,
        };
      }
      if (
        body.socials !== undefined &&
        typeof body.socials === "object" &&
        body.socials !== null
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
      if (
        Object.keys(updatedUnsafeMetadata).length > 0 ||
        Object.keys(currentUnsafeMetadata).length > 0
      ) {
        updates.unsafeMetadata = updatedUnsafeMetadata;
      }

      if (body.avatarUrl !== undefined && typeof body.avatarUrl === "string") {
        updates.imageUrl = body.avatarUrl;
      } else if (body.avatarUrl === null) {
        // Allow setting avatarUrl to null to clear it
        updates.imageUrl = null;
      }

      if (body.firstName !== undefined && typeof body.firstName === "string") {
        updates.firstName = body.firstName;
      }
      if (body.lastName !== undefined && typeof body.lastName === "string") {
        updates.lastName = body.lastName;
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { message: "Bad Request: No valid fields provided for update" },
          { status: 400 }
        );
      }

      const clerk = await clerkClient();
      const updatedUser = await clerk.users.updateUser(session.userId, updates);

      return NextResponse.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          emailAddresses: updatedUser.emailAddresses,
          imageUrl: updatedUser.imageUrl,
          unsafeMetadata: updatedUser.unsafeMetadata,
        },
      });
    } catch (error: any) {
      if (error) {
        console.error(
          `Clerk API error during user update for ${session.userId}:`,
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
          `An unexpected error occurred in /me POST for user ${session.userId}:`,
          error
        );
        return NextResponse.json(
          { message: "An internal server error occurred" },
          { status: 500 }
        );
      }
    }
  }
);
