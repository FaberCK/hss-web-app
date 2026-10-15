import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class DepartmentAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: Unauthenticated request.');
    }

    // Admins bypass granular department-level restrictions
    if (user.roles.includes('ADMIN')) {
      return true;
    }

    // If the user has no departments assigned in this scope, deny access
    if (!user.allowedDepartments || user.allowedDepartments.length === 0) {
      throw new ForbiddenException('Access denied: No department permissions found in the active scope.');
    }

    // Dynamic Validation: If the request body or params target a specific department, verify it
    const targetDeptId = request.body?.departmentId || request.params?.departmentId;
    
    if (targetDeptId && !user.allowedDepartments.includes(targetDeptId)) {
      throw new ForbiddenException('Access denied: You do not have permission to modify this specific department.');
    }

    return true;
  }
}