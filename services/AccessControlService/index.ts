/**
 * AccessControlService provides a flexible and database-driven mechanism
 * to authorize API routes based on user roles. It integrates with Clerk
 * for authentication and maps Clerk users to local database users with
 * roles stored in the database. Supports:
 * 
 * - Dynamic role-based route control
 * - Fallback creation of DB user if missing
 * - Optional system-level authentication via HMAC signature
 * - Read/Write permission checks via role matrix
 * 
 * Usage:
 * 
 * ```ts
 * import { AccessControlService } from '@/services/AccessControlService';
 * import { UserRole } from '@prisma/client';
 * 
 * const access = new AccessControlService([UserRole.ADMIN]);
 * 
 * export function GET(req: NextRequest) {
 *    const unauthorized = await access.requireReadAccess(req);
 *    if (unauthorized) return unauthorized;
 *    const session = await access.getSessionInfo(req);
 *    ... rest of api logic 
 * }
 * ```
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prismaUtils';
import { UserRole, User } from '@prisma/client';

// ----- Role Types -----
export type Role = UserRole;

export interface SessionInfo {
  userId: string;
  role: Role;
}

const SYSTEM_SECRET = process.env.SYSTEM_API_SECRET!;
const SIGNATURE_HEADER = 'x-signature';

// ----- Role Permissions Matrix -----
const roleAccessMatrix: Record<Role, { canRead: boolean; canWrite: boolean }> = {
  [UserRole.ADMIN]: { canRead: true, canWrite: true },
  [UserRole.KINGDOM_MEMBER]: { canRead: true, canWrite: true },
  [UserRole.SYSTEM]: { canRead: true, canWrite: true },
};

export class AccessControlService {
  private allowedRoles: Role[];

  constructor(allowedRoles: Role[]) {
    this.allowedRoles = allowedRoles;
  }

  private canRead(role: Role): boolean {
    return roleAccessMatrix[role]?.canRead ?? false;
  }

  private canWrite(role: Role): boolean {
    return roleAccessMatrix[role]?.canWrite ?? false;
  }

  private isAllowed(role: Role): boolean {
    return this.allowedRoles.includes(role);
  }

  // --- Helper: Create DB user if not found ---
  private async getOrCreateLocalUser(clerkId: string): Promise<User | null> {
    try {
      let user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[AccessControl] Creating local user for clerkId ${clerkId}`);
        }
        let imageUrl: string | null = null;
        try {
          const clerk = await clerkClient();
          const cu = await clerk.users.getUser(clerkId);
          imageUrl = cu?.imageUrl ?? null;
        } catch {}
        user = await prisma.user.create({ data: { clerkId, avatarUrl: imageUrl ?? undefined } });
      }
      return user;
    } catch (e: any) {
      // Prisma P1001: database unreachable. Fall back to a minimal session role
      if (e?.code === 'P1001') {
        const override = (process.env.ADMIN_OVERRIDE_IDS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .includes(clerkId);
        console.warn('[AccessControl] DB unavailable (P1001). Falling back to session role:', override ? 'ADMIN (override)' : 'KINGDOM_MEMBER');
        // Return a minimal shape with only the fields we use downstream
        const partial: Partial<User> = {
          id: 'fallback' as any,
          clerkId,
          role: override ? UserRole.ADMIN : UserRole.KINGDOM_MEMBER,
        };
        return partial as User;
      }
      console.error('[AccessControl] Unexpected error resolving local user:', e);
      return null;
    }
  }

  // --- HMAC Support for System Requests ---
  private async getRawBody(req: NextRequest): Promise<string> {
    const reader = req.body?.getReader();
    if (!reader) return '';
    const chunks: Uint8Array[] = [];
    let result = await reader.read();
    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  public async isSystemRequest(req: NextRequest): Promise<boolean> {
    const signature = req.headers.get(SIGNATURE_HEADER);
    if (!signature) return false;

    const rawBody = await this.getRawBody(req);
    const expected = crypto
      .createHmac('sha256', SYSTEM_SECRET)
      .update(rawBody)
      .digest('hex');

    return signature === expected;
  }

  public async getSessionInfo(req: NextRequest): Promise<SessionInfo | null> {
    if (await this.isSystemRequest(req)) {
      return { userId: 'System', role: UserRole.SYSTEM };
    }

    const { userId } = await auth();
    if (!userId) return null;

  const user = await this.getOrCreateLocalUser(userId);
    if (!user) return null;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AccessControl] SessionInfo:', { userId: user.clerkId, role: user.role });
    }

    return { userId: user.clerkId, role: user.role };
  }

  // --- Access Enforcement Wrappers ---
  public async requireReadAccess(req: NextRequest): Promise<NextResponse | null> {
    const session = await this.getSessionInfo(req);
    if (!session) {
      return NextResponse.json({ message: 'Authentication Required' }, { status: 401 });
    }

    if (!this.isAllowed(session.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient Role' }, { status: 403 });
    }

    if (!this.canRead(session.role)) {
      return NextResponse.json({ message: 'Unauthorized: No Read Permission' }, { status: 401 });
    }

    return null;
  }

  public async requireWriteAccess(req: NextRequest): Promise<NextResponse | null> {
    const session = await this.getSessionInfo(req);
    if (!session) {
      return NextResponse.json({ message: 'Authentication Required' }, { status: 401 });
    }

    if (!this.isAllowed(session.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient Role' }, { status: 403 });
    }

    if (!this.canWrite(session.role)) {
      return NextResponse.json({ message: 'Unauthorized: No Write Permission' }, { status: 401 });
    }

    return null;
  }
}

export const generateSystemSignature = (body: string) => {
  const secret = process.env.SYSTEM_API_SECRET!;
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// --- Default Export for Standard Admin Usage ---
const defaultAccessRoles = new AccessControlService([UserRole.ADMIN, UserRole.SYSTEM]);
export default defaultAccessRoles;
