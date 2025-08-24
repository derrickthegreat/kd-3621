import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { AccessControlService } from "@/services/AccessControlService";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prismaUtils";

// Update user role in app DB via Clerk publicMetadata.role and our DB mirror (if needed later)
const acs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const unauthorized = await acs.requireWriteAccess(req);
  if (unauthorized) return unauthorized;

  const { userId } = await params;
  const body = await req.json().catch(() => ({}));
  const role = String(body?.role || "").toUpperCase();
  if (!role || !["ADMIN", "KINGDOM_MEMBER", "SYSTEM"].includes(role)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  try {
    const clerk = await clerkClient();
    const updated = await clerk.users.updateUser(userId, { publicMetadata: { role } });
    // Mirror in application DB
    const appUser = await prisma.user.update({ where: { clerkId: userId }, data: { role: role as UserRole } });
    return NextResponse.json({
      message: "Role updated",
      user: { id: updated.id, publicMetadata: updated.publicMetadata, appRole: appUser.role },
    });
  } catch (e) {
    console.error("/users/[userId]/role POST failed", e);
    return NextResponse.json({ message: "Failed to update role" }, { status: 500 });
  }
}
