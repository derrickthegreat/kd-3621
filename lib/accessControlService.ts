import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server'

export type Role = 'Admin' | 'System' | 'Kingdom-Member';

interface SessionInfo {
  userId: string;
  role: Role;
}

export async function getSessionInfo(): Promise<SessionInfo | null> {
  const { userId } = await auth();

  if (!userId) return null;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const role = user.publicMetadata?.role as Role | undefined;
  return role ? { userId, role } : null;
}

export function canWrite(role: Role): boolean {
  return ['Admin', 'System'].includes(role);
}

export function canRead(role: Role): boolean {
  return ['Admin', 'System', 'Kingdom-Member'].includes(role);
}
