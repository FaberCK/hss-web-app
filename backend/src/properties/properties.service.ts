import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property, Role } from '@prisma/client';
import { divisionWhereForScopes, hubWhereForScopes, propertyWhereForScopes } from '../auth/scope-query';
import type { UserScopeGrant } from '../auth/interfaces/user-context.interface';

/**
 * Service handling property management business logic and uniqueness constraints.
 */
@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createProperty(createPropertyDto: CreatePropertyDto, scopes: UserScopeGrant[]): Promise<Property> {
    const { divisionId, code, hubId } = createPropertyDto;

    const divisionWhere = hubId
      ? {
          AND: [
            { id: divisionId },
            { hubs: { some: { AND: [{ id: hubId }, hubWhereForScopes(scopes)] } } },
          ],
        }
      : { AND: [{ id: divisionId }, divisionWhereForScopes(scopes)] };
    const division = await this.prisma.division.findFirst({
      where: divisionWhere,
      select: { id: true },
    });
    if (!division) {
      throw new NotFoundException(`Division with ID '${divisionId}' not found.`);
    }

    const existingProperty = await this.prisma.property.findUnique({
      where: {
        divisionId_code: {
          divisionId,
          code,
        },
      },
    });

    if (existingProperty) {
      throw new ConflictException(`Property with code '${code}' already exists in this division.`);
    }

    return this.prisma.property.create({
      data: {
        name: createPropertyDto.name,
        code,
        divisionId,
        organizationId: createPropertyDto.organizationId,
        ...(hubId ? { hubs: { connect: { id: hubId } } } : {}),
      },
    });
  }

  async updateProperty(id: string, updatePropertyDto: UpdatePropertyDto, scopes: UserScopeGrant[]): Promise<Property> {
    const { name, code, departmentIds } = updatePropertyDto;

    return this.prisma.$transaction(async (transaction) => {
      const property = await transaction.property.findFirst({
        where: { AND: [{ id }, propertyWhereForScopes(scopes)] },
        select: { id: true, divisionId: true },
      });
      if (!property) {
        throw new NotFoundException(`Property with ID '${id}' not found.`);
      }

      const duplicateCode = await transaction.property.findFirst({
        where: { divisionId: property.divisionId, code, id: { not: id } },
        select: { id: true },
      });
      if (duplicateCode) {
        throw new ConflictException(`Property code '${code}' already exists in this division.`);
      }

      const departmentCount = await transaction.department.count({
        where: { id: { in: departmentIds } },
      });
      if (departmentCount !== departmentIds.length) {
        throw new BadRequestException('One or more selected departments do not exist.');
      }

      return transaction.property.update({
        where: { id: property.id },
        data: {
          name,
          code,
          departments: {
            deleteMany: {},
            create: departmentIds.map((departmentId) => ({
              department: { connect: { id: departmentId } },
            })),
          },
        },
        include: {
          division: true,
          hubs: true,
          departments: { include: { department: true } },
        },
      });
    });
  }

  async findAllProperties(scopes: UserScopeGrant[]): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: propertyWhereForScopes(scopes),
      include: {
        division: true,
        _count: { select: { hubs: true } },
        departments: {
          where: scopes.some((scope) => scope.role === Role.ADMIN)
            ? {}
            : { departmentId: { in: [...new Set(scopes.flatMap((scope) => scope.departmentIds))] } },
          include: { department: true },
        },
      },
    });
  }

  async findPropertyById(id: string, scopes: UserScopeGrant[]): Promise<Property> {
    const property = await this.prisma.property.findFirst({
      where: { AND: [{ id }, propertyWhereForScopes(scopes)] },
      include: {
        division: true,
        hubs: true,
        departments: {
          where: scopes.some((scope) => scope.role === Role.ADMIN)
            ? {}
            : { departmentId: { in: [...new Set(scopes.flatMap((scope) => scope.departmentIds))] } },
          include: { department: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${id}' not found.`);
    }

    return property;
  }
}