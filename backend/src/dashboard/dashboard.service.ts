import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../shared/prisma/prisma.service';
import { propertyWhereForScopes } from '../auth/scope-query';
import type { UserScopeGrant } from '../auth/interfaces/user-context.interface';

export interface ScopeSummary {
  scopeId: string;
  totalProperties: number;
  totalConfiguredDepartments: number;
  activeUsersCount: number;
  propertyBreakdown: {
    id: string;
    name: string;
    code: string;
    departmentCount: number;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getScopeSummary(activeScopes: UserScopeGrant[]): Promise<ScopeSummary> {
    // Aggregate properties and associated department relations bottom-up
    const properties = await this.prisma.property.findMany({
      where: propertyWhereForScopes(activeScopes),
      include: {
        departments: {
          where: activeScopes.some((scope) => scope.role === Role.ADMIN)
            ? {}
            : { departmentId: { in: [...new Set(activeScopes.flatMap((scope) => scope.departmentIds))] } },
          include: { department: true },
        },
      },
    });

    // Unique departments configured across all scoped properties
    const uniqueDepartmentIds = new Set<string>();
    properties.forEach((prop) => {
      prop.departments.forEach((dept) => uniqueDepartmentIds.add(dept.departmentId));
    });

    // Count users scoped to the current scope
    const userScopes = await this.prisma.userScope.findMany({
      where: activeScopes.length > 0
        ? { OR: activeScopes.map(({ entityId, scopeLevel }) => ({ entityId, scopeLevel })) }
        : { id: { in: [] } },
      include: { user: true },
    });

    const activeUsers = userScopes.filter((s) => s.user.status === 'ACTIVE').length;

    return {
      scopeId: activeScopes.length === 1 ? activeScopes[0].entityId : 'ASSIGNED',
      totalProperties: properties.length,
      totalConfiguredDepartments: uniqueDepartmentIds.size,
      activeUsersCount: activeUsers,
      propertyBreakdown: properties.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        departmentCount: p.departments.length,
      })),
    };
  }
}