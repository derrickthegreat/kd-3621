import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prismaUtils';
import { clerkClient } from '@clerk/nextjs/server';
import { AccessControlService } from '@/services/AccessControlService/index';
import { UserRole } from '@prisma/client';

const allowedRoles = [UserRole.ADMIN, UserRole.SYSTEM, UserRole.KINGDOM_MEMBER];
const acs = new AccessControlService(allowedRoles);
console.log(acs);

export async function GET(req: NextRequest) {
  const unauthorized = await acs.requireReadAccess(req);
  if (unauthorized) return unauthorized;

  const session = await acs.getSessionInfo(req);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);

  const player = await prisma.player.findFirst({
    where: { userId: session.userId },
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
          snapshot: 'desc',
        },
        take: 1, // Only return the latest snapshot
      },
    },
  });

  return NextResponse.json({
    user,
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
          stats: player.stats.length > 0 ? player.stats[0] : null,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const unauthorized = await acs.requireWriteAccess(req);
  if (unauthorized) return unauthorized;

  const session = await acs.getSessionInfo(req);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const updates: any = {};

  // Only update unsafeMetadata fields if any are present
  if (data.birthday || data.socials || data.profileColor) {
    updates.unsafeMetadata = {
      ...(data.birthday && { birthday: data.birthday }),
      ...(data.socials && { socials: data.socials }),
      ...(data.profileColor && { profileColor: data.profileColor }),
    };
  }

  // Update avatar if provided
  if (data.avatarUrl) {
    updates.imageUrl = data.avatarUrl;
  }

  // Only call update if something changed
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  const clerk = await clerkClient();
  await clerk.users.updateUser(session.userId, updates);

  return NextResponse.json({ message: 'Profile updated' });
}