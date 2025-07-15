import { NextRequest, NextResponse } from 'next/server';
import { AccessControlService } from '@/services/AccessControlService';
import { UserRole } from '@prisma/client';

type AccessMode = 'read' | 'write';

interface SessionContext {
  userId: string;
  role: UserRole;
}

// Update handler to accept both req and context (e.g. params)
type Handler = (
  req: NextRequest,
  context: { params: Record<string, string> },
  session: SessionContext
) => Promise<NextResponse>;

export function withAccessControl(
  roles: UserRole[],
  handler: Handler,
  mode: AccessMode = 'read'
) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const access = new AccessControlService(roles);

    const unauthorized =
      mode === 'write'
        ? await access.requireWriteAccess(req)
        : await access.requireReadAccess(req);

    if (unauthorized) return unauthorized;

    const session = await access.getSessionInfo(req);
    if (!session) {
      return NextResponse.json({ message: 'Session could not be resolved' }, { status: 401 });
    }

    return handler(req, context, session);
  };
}
