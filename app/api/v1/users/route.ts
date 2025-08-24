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
      },
    });

    if (!users.length) return NextResponse.json({ users: [] });

    const clerk = await clerkClient();
    const clerkIds = users.map((u) => u.clerkId);
    // Batch fetch by IDs (Clerk SDK supports filtering by userId)
  const clerkList = await clerk.users.getUserList({ userId: clerkIds, limit: clerkIds.length });
  const list = (clerkList as any).data ?? clerkList; // support differing SDK typings
  const byId: Map<string, any> = new Map((list as any[]).map((u: any) => [u.id, u]));

    const payload = users.map((u) => {
      const cu = byId.get(u.clerkId);
      return {
        id: u.id,
        clerkId: u.clerkId,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        governorsCount: u._count.governors,
    profile: cu
          ? {
      id: cu.id,
      firstName: cu.firstName,
      lastName: cu.lastName,
      fullName: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.username || cu.id,
      email: (cu.emailAddresses?.[0]?.emailAddress) ?? null,
      imageUrl: cu.imageUrl,
      publicMetadata: cu.publicMetadata ?? {},
            }
          : null,
      };
    });

    return NextResponse.json({ users: payload });
  } catch (err) {
    console.error("/api/v1/users GET failed", err);
    return NextResponse.json({ message: "Failed to load users" }, { status: 500 });
  }
}
