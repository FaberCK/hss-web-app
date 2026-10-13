import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

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

  async getScopeSummary(activeScopeId?: string): Promise<ScopeSummary> {
    let propertyFilter: any = {};

    if (activeScopeId) {
      const [isOrg, isDiv, isHub, isProp] = await Promise.all([
        this.prisma.organization.findUnique({ where: { id: activeScopeId } }),
        this.prisma.division.findUnique({ where: { id: activeScopeId } }),
        this.prisma.hub.findUnique({ where: { id: activeScopeId } }),
        this.prisma.property.findUnique({ where: { id: activeScopeId } }),
      ]);

      if (isOrg) {
        propertyFilter = { organizationId: activeScopeId };
      } else if (isDiv) {
        propertyFilter = { divisionId: activeScopeId };
      } else if (isHub) {
        propertyFilter = { hubs: { some: { id: activeScopeId } } };
      } else if (isProp) {
        propertyFilter = { id: activeScopeId };
      }
    }

    // Aggregate properties and associated department relations bottom-up
    const properties = await this.prisma.property.findMany({
      where: propertyFilter,
      include: {
        departments: {
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
      where: activeScopeId ? { entityId: activeScopeId } : {},
      include: { user: true },
    });

    const activeUsers = userScopes.filter((s) => s.user.status === 'ACTIVE').length;

    return {
      scopeId: activeScopeId || 'GLOBAL',
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