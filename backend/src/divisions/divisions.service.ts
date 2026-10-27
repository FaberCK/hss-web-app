import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, ScopeLevel, type Division } from '@prisma/client';
import { divisionWhereForScopes } from '../auth/scope-query';
import type { UserScopeGrant } from '../auth/interfaces/user-context.interface';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';

@Injectable()
export class DivisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(scopes: UserScopeGrant[]): Promise<Division[]> {
    return this.prisma.division.findMany({
      where: divisionWhereForScopes(scopes),
      include: { organization: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateDivisionDto, scopes: UserScopeGrant[], userOrganizationId: string): Promise<Division> {
    const canAssignOrganization = scopes.some(
      (scope) => scope.scopeLevel === ScopeLevel.ORGANIZATION && scope.entityId === dto.organizationId,
    );
    if (!canAssignOrganization || dto.organizationId !== userOrganizationId) {
      throw new ForbiddenException('You can only create divisions in an organization you administer.');
    }

    return this.prisma.division.create({
      data: dto,
      include: { organization: true },
    });
  }

  async update(
    id: string,
    dto: UpdateDivisionDto,
    scopes: UserScopeGrant[],
    userOrganizationId: string,
  ): Promise<Division> {
    const division = await this.prisma.division.findFirst({
      where: { AND: [{ id }, divisionWhereForScopes(scopes)] },
    });
    if (!division) {
      throw new NotFoundException(`Division with ID '${id}' not found.`);
    }

    const canAssignOrganization = scopes.some(
      (scope) => scope.role === Role.ADMIN
        && scope.scopeLevel === ScopeLevel.ORGANIZATION
        && scope.entityId === dto.organizationId,
    );
    if (dto.organizationId !== division.organizationId
      && (!canAssignOrganization || dto.organizationId !== userOrganizationId)) {
      throw new ForbiddenException('You can only assign divisions to an organization you administer.');
    }

    return this.prisma.division.update({
      where: { id },
      data: { name: dto.name, organizationId: dto.organizationId },
      include: { organization: true },
    });
  }

  async remove(id: string, scopes: UserScopeGrant[]): Promise<Division> {
    const division = await this.prisma.division.findFirst({
      where: { AND: [{ id }, divisionWhereForScopes(scopes)] },
      select: { id: true },
    });
    if (!division) {
      throw new NotFoundException(`Division with ID '${id}' not found.`);
    }

    const [propertyCount, hubCount] = await Promise.all([
      this.prisma.property.count({ where: { divisionId: id } }),
      this.prisma.hub.count({ where: { divisionId: id } }),
    ]);
    if (propertyCount > 0 || hubCount > 0) {
      throw new BadRequestException('Move or remove this division’s properties and Hubs before deleting it.');
    }

    return this.prisma.division.delete({ where: { id } });
  }
}