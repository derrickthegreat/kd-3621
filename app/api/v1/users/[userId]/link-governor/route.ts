import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prismaUtils";
import { AccessControlService } from "@/services/AccessControlService";
import { UserRole } from "@prisma/client";

const acs = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const unauthorized = await acs.requireWriteAccess(req);
  if (unauthorized) return unauthorized;
  const { userId } = await params;
  const body = await req.json().catch(() => ({}));
  const { playerId } = body || {};
  if (!playerId || typeof playerId !== "string") {
    return NextResponse.json({ message: "playerId required" }, { status: 400 });
  }
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return NextResponse.json({ message: "Player not found" }, { status: 404 });

    // Upsert link
    await prisma.userPlayer.upsert({
      where: { userId_playerId: { userId: user.id, playerId } },
      create: { userId: user.id, playerId },
      update: {},
    });
    return NextResponse.json({ message: "Linked" });
  } catch (e) {
    console.error("link-governor failed", e);
    return NextResponse.json({ message: "Failed to link" }, { status: 500 });
  }
}
