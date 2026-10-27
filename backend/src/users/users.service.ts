import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { ScopeLevel, UserStatus, type Prisma, type User } from '@prisma/client';
import { userScopeWhereForScopes } from '../auth/scope-query';
import type { UserScopeGrant } from '../auth/interfaces/user-context.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async inviteUser(inviteUserDto: InviteUserDto): Promise<User> {
    const { employeeId, email, organizationId, role, scopeLevel, entityId, departmentIds, firstName, lastName } = inviteUserDto;

    await this.validateScope(organizationId, scopeLevel, entityId, departmentIds ?? []);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { eid: employeeId }],
      },
    });

    if (existingUser) {
      throw new ConflictException(`User with email '${email}' or Employee ID '${employeeId}' already exists.`);
    }

    return this.prisma.user.create({
      data: {
        eid: employeeId,
        email,
        firstName,
        lastName,
        organizationId,
        status: UserStatus.PENDING,
        scopes: {
          create: {
            role,
            scopeLevel,
            entityId,
            departments: departmentIds && departmentIds.length > 0 ? {
              create: departmentIds.map((departmentId) => ({
                department: { connect: { id: departmentId } },
              })),
            } : undefined,
          },
        },
      },
      include: {
        scopes: {
          include: {
            departments: true,
          },
        },
      },
    });
  }

  async findAllUsers(scopes: UserScopeGrant[]): Promise<User[]> {
    const scopeFilter = userScopeWhereForScopes(scopes);
    return this.prisma.user.findMany({
      where: { scopes: { some: scopeFilter } },
      include: {
        scopes: {
          where: scopeFilter,
          include: {
            departments: {
              include: { department: true },
            },
          },
        },
      },
    });
  }

  private async validateScope(
    organizationId: string,
    scopeLevel: ScopeLevel,
    entityId: string,
    departmentIds: string[],
  ): Promise<void> {
    let isValidEntity = false;

    switch (scopeLevel) {
      case ScopeLevel.ORGANIZATION:
        isValidEntity = entityId === organizationId && Boolean(
          await this.prisma.organization.findUnique({ where: { id: entityId }, select: { id: true } }),
        );
        break;
      case ScopeLevel.DIVISION:
        isValidEntity = Boolean(
          await this.prisma.division.findFirst({
            where: { id: entityId, organizationId },
            select: { id: true },
          }),
        );
        break;
      case ScopeLevel.HUB:
        isValidEntity = Boolean(
          await this.prisma.hub.findFirst({
            where: { id: entityId, division: { is: { organizationId } } },
            select: { id: true },
          }),
        );
        break;
      case ScopeLevel.PROPERTY:
        isValidEntity = Boolean(
          await this.prisma.property.findFirst({
            where: { id: entityId, organizationId },
            select: { id: true },
          }),
        );
        break;
    }

    if (!isValidEntity) {
      throw new BadRequestException('The selected scope entity does not match the organization and scope level.');
    }

    if (departmentIds.length === 0) return;

    let propertyWhere: Prisma.PropertyWhereInput;
    switch (scopeLevel) {
      case ScopeLevel.ORGANIZATION:
        propertyWhere = { organizationId };
        break;
      case ScopeLevel.DIVISION:
        propertyWhere = { divisionId: entityId };
        break;
      case ScopeLevel.HUB:
        propertyWhere = { hubs: { some: { id: entityId } } };
        break;
      case ScopeLevel.PROPERTY:
        propertyWhere = { id: entityId };
        break;
    }

    const scopedProperties = await this.prisma.property.findMany({
      where: propertyWhere,
      select: { departments: { select: { departmentId: true } } },
    });
    const allowedDepartmentIds = new Set(
      scopedProperties.flatMap((property) => property.departments.map(({ departmentId }) => departmentId)),
    );

    if (departmentIds.some((departmentId) => !allowedDepartmentIds.has(departmentId))) {
      throw new BadRequestException('Selected departments must belong to properties within the assigned scope.');
    }
  }
}
