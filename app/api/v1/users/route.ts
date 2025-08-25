import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prismaUtils";
import { AccessControlService } from "@/services/AccessControlService";
import { UserRole } from "@prisma/client";

// Admin/System only: list application users with Clerk profile details
const acs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);

export async function GET(req: NextRequest) {
  const unauthorized = await acs.requireReadAccess(req);
  if (unauthorized) return unauthorized;

  try {
  const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clerkId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { governors: true } },
    // app profile fields
    username: true,
    displayName: true,
    avatarUrl: true,
    commanderAvatarId: true,
    socials: true,
      },
    });

    if (!users.length) return NextResponse.json({ users: [] });

    const clerk = await clerkClient();
    const clerkIds = users.map((u) => u.clerkId);
    // Batch fetch by IDs (Clerk SDK supports filtering by userId)
  const clerkList = await clerk.users.getUserList({ userId: clerkIds, limit: clerkIds.length });
  const list = (clerkList as any).data ?? clerkList; // support differing SDK typings
  const byId: Map<string, any> = new Map((list as any[]).map((u: any) => [u.id, u]));

    // Commander icon map for fallbacks
    const commanderIds = Array.from(new Set(users.map(u => u.commanderAvatarId).filter(Boolean))) as string[];
    const commanderIconMap = new Map<string, string>();
    if (commanderIds.length) {
      try {
        const icons = await prisma.commander.findMany({ where: { id: { in: commanderIds } }, select: { id: true, iconUrl: true } });
        icons.forEach(i => commanderIconMap.set(i.id, i.iconUrl || ''));
      } catch {}
    }

    const payload = users.map((u) => {
      const cu = byId.get(u.clerkId);
      const clerkEmail = cu?.emailAddresses?.[0]?.emailAddress ?? null;
      const clerkImage = cu?.imageUrl ?? null;
  const appAvatar = u.avatarUrl ?? null;
  const commanderIcon = u.commanderAvatarId ? (commanderIconMap.get(u.commanderAvatarId) || null) : null;
  // Prefer app avatar; else commander icon; else Clerk image (default)
  const effectiveAvatarUrl = appAvatar || commanderIcon || clerkImage;
      return {
        id: u.id,
        clerkId: u.clerkId,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        governorsCount: u._count.governors,
        profile: {
          id: cu?.id || u.clerkId,
          firstName: cu?.firstName ?? null,
          lastName: cu?.lastName ?? null,
          fullName: cu ? ([cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.username || cu.id) : u.clerkId,
          email: clerkEmail,
          imageUrl: clerkImage,
          publicMetadata: cu?.publicMetadata ?? {},
          // app profile additions
          displayName: u.displayName ?? null,
          username: u.username ?? null,
          appAvatarUrl: appAvatar,
          commanderAvatarId: u.commanderAvatarId ?? null,
          socials: u.socials ?? null,
          effectiveAvatarUrl,
        },
      };
    });

    return NextResponse.json({ users: payload });
  } catch (err) {
    console.error("/api/v1/users GET failed", err);
    return NextResponse.json({ message: "Failed to load users" }, { status: 500 });
  }
}
