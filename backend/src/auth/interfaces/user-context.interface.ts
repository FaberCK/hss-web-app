import { Role, ScopeLevel } from '@prisma/client';

/**
 * Represents the authenticated user context enriched with active scope permissions.
 */
export interface UserContext {
  userId: string;
  email: string;
  organizationId: string;
  activeScopeId?: string;
  assignedScopes: UserAssignedScope[];
  activeScopes: UserScopeGrant[];
  roles: Role[];
  allowedDepartments: string[];
  scopeLevel?: ScopeLevel;
}

export interface UserScopeGrant {
  entityId: string;
  scopeLevel: ScopeLevel;
  role: Role;
  departmentIds: string[];
}

// Extend Express Request object globally so req.user is fully typed
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

export interface UserAssignedScope extends UserScopeGrant {
  name: string;
}