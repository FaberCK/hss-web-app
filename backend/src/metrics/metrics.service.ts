// backend/src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getScopeSummary(scopeId?: string) {
    // Queries properties belonging to the target scope (Organization, Division, Hub, or Property)
    const propertyCount = await this.prisma.property.count({
      where: scopeId ? { OR: [{ id: scopeId }, { divisionId: scopeId }, { organizationId: scopeId }] } : {},
    });

    const activeUsersCount = await this.prisma.user.count({
      where: { status: 'ACTIVE' },
    });

    const totalDepartments = await this.prisma.department.count();

    return {
      activeProperties: propertyCount,
      activeUsers: activeUsersCount,
      totalDepartments,
      occupancyRate: '84.2%', // Sample aggregated metric
      pendingMaintenanceTasks: 12,
    };
  }
}