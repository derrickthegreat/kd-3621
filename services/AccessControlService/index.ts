// services/AccessControlService.ts
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prismaUtils';
import { UserRole } from '@prisma/client';

// ----- Role Types -----
// This can now be derived directly from your Prisma enum
export type Role = UserRole;

export interface SessionInfo {
  userId: string;
  role: Role;
}

const SYSTEM_SECRET = process.env.SYSTEM_API_SECRET!;
const SIGNATURE_HEADER = 'x-signature';

// ----- Role Permissions Matrix -----
// This is a mapping from your DB roles to permissions.
// You can keep this hardcoded for now or make it dynamic by storing
// permissions in the DB with Prisma.
const roleAccessMatrix: Record<Role, { canRead: boolean; canWrite: boolean }> = {
  [UserRole.ADMIN]: { canRead: true, canWrite: true },
  [UserRole.KINGDOM_MEMBER]: { canRead: true, canWrite: true },
  [UserRole.SYSTEM]: { canRead: true, canWrite: true },
  [UserRole.MIGRANT]: { canRead: true, canWrite: false },
};

export class AccessControlService {
  private allowedRoles: Role[];

  constructor(allowedRoles: Role[]) {
    this.allowedRoles = allowedRoles;
  }

  // Helper methods now use the matrix defined above
  private canRead(role: Role): boolean {
    return roleAccessMatrix[role]?.canRead ?? false;
  }

  private canWrite(role: Role): boolean {
    return roleAccessMatrix[role]?.canWrite ?? false;
  }

  // --- HMAC Support for System Requests (No Change) ---
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

  // --- Session Resolution (REFUNDED) ---
  public async getSessionInfo(req: NextRequest): Promise<SessionInfo | null> {
    // 1. Handle System Requests first
    if (await this.isSystemRequest(req)) {
      return { userId: 'System', role: UserRole.SYSTEM };
    }

    // 2. Authenticate with Clerk
    const { userId } = await auth();
    if (!userId) return null;

    // 3. Find the user in your database using their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Option: Create the user if they don't exist
      // const clerkUser = await clerkClient().users.getUser(userId);
      // const newUser = await prisma.user.create({
      //   data: {
      //     clerkId: userId,
      //     role: UserRole.KINGDOM_MEMBER, // Default role
      //     // ... other fields from clerkUser
      //   },
      // });
      // return { userId, role: newUser.role };
      console.warn(`User with clerkId ${userId} not found in database.`);
      return null;
    }

    // 4. Return the session info with the role from the database
    return { userId, role: user.role };
  }

  // --- Access Enforcement Wrappers ---
  public async requireReadAccess(req: NextRequest): Promise<NextResponse | null> {
    const session = await this.getSessionInfo(req);

    if (!session) {
      return NextResponse.json({ message: 'Authentication Required' }, { status: 401 });
    }
    
    // Check if the user's role is in the list of allowed roles for this route
    if (!this.allowedRoles.includes(session.role)) {
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

    if (!this.allowedRoles.includes(session.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient Role' }, { status: 403 });
    }

    if (!this.canWrite(session.role)) {
      return NextResponse.json({ message: 'Unauthorized: No Write Permission' }, { status: 401 });
    }

    return null;
  }
}