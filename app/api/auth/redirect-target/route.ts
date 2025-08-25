import { NextRequest, NextResponse } from "next/server";
import { AccessControlService } from "@/services/AccessControlService";
import { UserRole } from "@prisma/client";

const acs = new AccessControlService([
  UserRole.ADMIN,
  UserRole.SYSTEM,
  UserRole.KINGDOM_MEMBER,
]);

export async function GET(req: NextRequest) {
  const session = await acs.getSessionInfo(req);
  if (!session) return NextResponse.json({ target: "/login" }, { status: 200 });

  const role = session.role;
  if (role === UserRole.ADMIN || role === UserRole.SYSTEM) {
    return NextResponse.json({ target: "/admin" }, { status: 200 });
  }
  return NextResponse.json({ target: "/players" }, { status: 200 });
}
