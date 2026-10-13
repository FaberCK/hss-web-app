import { Role, ScopeLevel } from '@prisma/client';

/**
 * Represents the authenticated user context enriched with active scope permissions.
 */
export interface UserContext {
  userId: string;
  email: string;
  organizationId: string;
  activeScopeId?: string;
  roles: Role[];
  allowedDepartments: string[];
  scopeLevel?: ScopeLevel;
}

// Extend Express Request object globally so req.user is fully typed
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}