import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubPropertiesDto } from './dto/update-hub-properties.dto';
import { Hub } from '@prisma/client';
import { divisionWhereForScopes, hubWhereForScopes, propertyWhereForScopes } from '../auth/scope-query';
import type { UserScopeGrant } from '../auth/interfaces/user-context.interface';

@Injectable()
export class HubsService {
  constructor(private readonly prisma: PrismaService) {}

  async createHub(createHubDto: CreateHubDto, scopes: UserScopeGrant[]): Promise<Hub> {
    const division = await this.prisma.division.findFirst({
      where: { AND: [{ id: createHubDto.divisionId }, divisionWhereForScopes(scopes)] },
      select: { id: true },
    });
    if (!division) {
      throw new NotFoundException(`Division with ID '${createHubDto.divisionId}' not found.`);
    }

    return this.prisma.hub.create({
      data: createHubDto,
    });
  }

  async updateHubProperties(id: string, updateDto: UpdateHubPropertiesDto, scopes: UserScopeGrant[]): Promise<Hub> {
    const hub = await this.prisma.hub.findFirst({
      where: { AND: [{ id }, hubWhereForScopes(scopes)] },
    });
    if (!hub) {
      throw new NotFoundException(`Hub with ID '${id}' not found.`);
    }

    const requestedPropertyIds = [...new Set(updateDto.propertyIds)];
    const allowedProperties = await this.prisma.property.count({
      where: {
        AND: [
          { id: { in: requestedPropertyIds }, divisionId: hub.divisionId },
          propertyWhereForScopes(scopes),
        ],
      },
    });
    if (allowedProperties !== requestedPropertyIds.length) {
      throw new BadRequestException('Hub properties must belong to the active scope and the hub division.');
    }

    // Using Prisma 'set' replaces all existing connections with the new provided array
    return this.prisma.hub.update({
      where: { id },
      data: {
        properties: {
          set: updateDto.propertyIds.map((propertyId) => ({ id: propertyId })),
        },
      },
      include: { properties: true },
    });
  }

  async findAllHubs(scopes: UserScopeGrant[]): Promise<Hub[]> {
    return this.prisma.hub.findMany({
      where: hubWhereForScopes(scopes),
      include: { properties: { where: propertyWhereForScopes(scopes) } },
    });
  }

  async deleteHub(id: string, scopes: UserScopeGrant[]): Promise<Hub> {
    const hub = await this.prisma.hub.findFirst({
      where: { AND: [{ id }, hubWhereForScopes(scopes)] },
      select: { id: true },
    });
    if (!hub) {
      throw new NotFoundException(`Hub with ID '${id}' not found.`);
    }

    return this.prisma.hub.delete({
      where: { id },
    });
  }
}