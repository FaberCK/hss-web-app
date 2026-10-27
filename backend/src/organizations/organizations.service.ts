import { Injectable } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(organizationId: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { id: organizationId },
      orderBy: { name: 'asc' },
    });
  }
}