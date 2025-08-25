import { prisma } from "./prismaUtils";

type LogParams = {
  action: string;
  // Actor can be provided as internal user.id or Clerk ID
  actorUserId?: string | null;
  actorClerkId?: string | null;
  // Target (subject) user can be provided as internal user.id or Clerk ID
  targetUserId?: string | null;
  targetClerkId?: string | null;
};

async function resolveUserId(opts: { userId?: string | null; clerkId?: string | null; createIfMissing?: boolean }): Promise<string | null> {
  const { userId, clerkId, createIfMissing = false } = opts;
  try {
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (u) return u.id;
    }
    if (clerkId) {
      const existing = await prisma.user.findUnique({ where: { clerkId } });
      if (existing) return existing.id;
      if (createIfMissing) {
        const created = await prisma.user.create({ data: { clerkId } });
        return created.id;
      }
    }
  } catch (e) {
    // swallow
  }
  return null;
}

export async function logUserAction(params: LogParams): Promise<void> {
  const { action } = params;
  if (!action) return;
  try {
    const [actorId, subjectId] = await Promise.all([
      resolveUserId({ userId: params.actorUserId, clerkId: params.actorClerkId ?? undefined, createIfMissing: true }),
      resolveUserId({ userId: params.targetUserId, clerkId: params.targetClerkId ?? undefined, createIfMissing: true }),
    ]);

    const userId = subjectId || actorId; // default to actor when no distinct subject
    const finalActorId = actorId || subjectId; // prefer actor, fallback to subject
    if (!userId || !finalActorId) return;

    await prisma.userAuditLog.create({
      data: {
        userId,
        actorId: finalActorId,
        action: String(action).slice(0, 1024),
      },
    });
  } catch (e) {
    // Never block main flow from audit issues
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[audit] failed to write audit log:', e);
    }
  }
}
