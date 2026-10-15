import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles are permitted to access a specific route or controller.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);