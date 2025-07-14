import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SYSTEM_SECRET = process.env.SYSTEM_API_SECRET!;
const SIGNATURE_HEADER = 'x-signature';

// ----- Role Types -----
export type Role = 'admin' | 'kingdom-member' | 'system';

export interface SessionInfo {
  userId: string;
  role: Role;
}

// ----- Role Permissions Map -----
const roleAccessMatrix: Record<Role, { canRead: boolean; canWrite: boolean }> = {
  "admin":            { canRead: true, canWrite: true },
  "kingdom-member":   { canRead: true, canWrite: true },
  "system":           { canRead: true, canWrite: true },
};

// ----- Derived Helpers -----
const validRoles = Object.keys(roleAccessMatrix) as Role[];

function isValidRole(role: string): role is Role {
  return validRoles.includes(role as Role);
}

function canRead(role: Role): boolean {
  return roleAccessMatrix[role].canRead;
}

function canWrite(role: Role): boolean {
  return roleAccessMatrix[role].canWrite;
}

// ----- HMAC Support for System Requests -----
async function getRawBody(req: NextRequest): Promise<string> {
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

export async function isSystemRequest(req: NextRequest): Promise<boolean> {
  const signature = req.headers.get(SIGNATURE_HEADER);
  if (!signature) return false;

  const rawBody = await getRawBody(req);
  const expected = crypto
    .createHmac('sha256', SYSTEM_SECRET)
    .update(rawBody)
    .digest('hex');

  return signature === expected;
}

// ----- Session Resolution -----
export async function getSessionInfo(req: NextRequest): Promise<SessionInfo | null> {
  if (await isSystemRequest(req)) {
    return { userId: 'System', role: 'system' };
  }

  const { userId } = await auth();
  if (!userId) return null;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const role = (user.publicMetadata.role as string).toLowerCase();
  if (!userId || !role || !isValidRole(role)) return null;

  return { userId, role };
}

// ----- Access Enforcement Wrappers -----
export async function requireReadAccess(req: NextRequest) {
  const session = await getSessionInfo(req);
  if (!session || !canRead(session.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function requireWriteAccess(req: NextRequest) {
  const session = await getSessionInfo(req);
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

const AccessControlService = {
  getSessionInfo,
  isSystemRequest,
  canRead,
  canWrite,
  requireReadAccess,
  requireWriteAccess
};

export default AccessControlService;
