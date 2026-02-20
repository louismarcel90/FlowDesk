export type Role = 'viewer' | 'editor' | 'approver' | 'admin';

export const RoleRank: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  approver: 3,
  admin: 4,
};

export type AuthPrincipal = {
  id: string;
  orgId: string;
  role: string;
};

export type Principal = {
  orgId: string;
  userId: string;
  role: string;
};
