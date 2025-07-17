export type AccessRole = 'admin' | 'kingdom-member' | 'system' | 'guest';

export interface RoutePermissions {
  canRead: boolean;
  canWrite: boolean;
}

export type RoleAccessMatrix = Record<AccessRole, RoutePermissions>;

export interface SessionInfo {
  userId: string;
  role: AccessRole;
}