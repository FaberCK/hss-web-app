import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubPropertiesDto } from './dto/update-hub-properties.dto';
import { Hub } from '@prisma/client';

@Injectable()
export class HubsService {
  constructor(private readonly prisma: PrismaService) {}

  async createHub(createHubDto: CreateHubDto): Promise<Hub> {
    return this.prisma.hub.create({
      data: createHubDto,
    });
  }

  async updateHubProperties(id: string, updateDto: UpdateHubPropertiesDto): Promise<Hub> {
    const hub = await this.prisma.hub.findUnique({ where: { id } });
    if (!hub) {
      throw new NotFoundException(`Hub with ID '${id}' not found.`);
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

  async findAllHubs(): Promise<Hub[]> {
    return this.prisma.hub.findMany({
      include: { properties: true },
    });
  }

  async deleteHub(id: string): Promise<Hub> {
    return this.prisma.hub.delete({
      where: { id },
    });
  }
}