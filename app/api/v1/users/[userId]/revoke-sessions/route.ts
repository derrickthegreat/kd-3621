import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { AccessControlService } from "@/services/AccessControlService";
import { UserRole } from "@prisma/client";

const acs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const unauthorized = await acs.requireWriteAccess(req);
  if (unauthorized) return unauthorized;
  const { userId } = await params;
  try {
    const clerk = await clerkClient();
    const sessions = await clerk.sessions.getSessionList({ userId, limit: 100 });
    const list = (sessions as any).data ?? sessions;
    await Promise.all((list as any[]).map((s: any) => clerk.sessions.revokeSession(s.id).catch(() => {})));
    return NextResponse.json({ message: "Sessions revoked" });
  } catch (e) {
    console.error("/users/[userId]/revoke-sessions POST failed", e);
    return NextResponse.json({ message: "Failed to revoke sessions" }, { status: 500 });
  }
}
