import { Injectable } from '@nestjs/common';
import { Organization, Role, ScopeLevel } from '@prisma/client';
import type { UserScopeGrant } from '../auth/interfaces/user-context.interface';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(scopes: UserScopeGrant[]): Promise<Organization[]> {
    const organizationIds = scopes
      .filter((scope) => scope.role === Role.ADMIN && scope.scopeLevel === ScopeLevel.ORGANIZATION)
      .map((scope) => scope.entityId);

    return this.prisma.organization.findMany({
      where: { id: { in: organizationIds } },
      orderBy: { name: 'asc' },
    });
  }
}