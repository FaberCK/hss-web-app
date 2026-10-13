import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { Property } from '@prisma/client';

/**
 * Service handling property management business logic and uniqueness constraints.
 */
@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createProperty(createPropertyDto: CreatePropertyDto): Promise<Property> {
    const { divisionId, code } = createPropertyDto;

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
      data: createPropertyDto,
    });
  }

  async findAllProperties(): Promise<Property[]> {
    return this.prisma.property.findMany({
      include: {
        division: true,
        departments: {
          include: { department: true },
        },
      },
    });
  }

  async findPropertyById(id: string): Promise<Property> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { division: true, hubs: true },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${id}' not found.`);
    }

    return property;
  }
}