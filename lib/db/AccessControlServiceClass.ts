// types/accessControl.ts (New file for shared types)
export type Role = 'admin' | 'kingdom-member' | 'system' | 'guest'; // Added 'guest' for example

export interface RoutePermissions {
  canRead: boolean;
  canWrite: boolean;
}

export type RoleAccessMatrix = Record<Role, RoutePermissions>;

export interface SessionInfo {
  userId: string;
  role: Role;
}