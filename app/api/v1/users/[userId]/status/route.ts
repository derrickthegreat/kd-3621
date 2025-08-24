import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { AccessControlService } from "@/services/AccessControlService";
import { UserRole } from "@prisma/client";

const acs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const unauthorized = await acs.requireWriteAccess(req);
  if (unauthorized) return unauthorized;
  const { userId } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").toLowerCase();
  if (!["deactivate", "reactivate"].includes(action)) {
    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const deactivated = action === "deactivate";

    // Mark in publicMetadata for UI, and end active sessions
    await clerk.users.updateUser(userId, { publicMetadata: { ...(user.publicMetadata || {}), deactivated } });
    if (deactivated) {
      const sessions = await clerk.sessions.getSessionList({ userId, limit: 100 });
      const sess = (sessions as any).data ?? sessions;
      await Promise.all((sess as any[]).map((s: any) => clerk.sessions.revokeSession(s.id).catch(() => {})));
    }

    return NextResponse.json({ message: deactivated ? "User deactivated" : "User reactivated" });
  } catch (e) {
    console.error("/users/[userId]/status POST failed", e);
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 });
  }
}
