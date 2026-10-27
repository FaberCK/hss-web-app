import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department, Role } from '@prisma/client';
import { propertyWhereForScopes } from '../auth/scope-query';
import type { UserScopeGrant } from '../auth/interfaces/user-context.interface';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDepartment(createDto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.prisma.department.findUnique({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException(`Department '${createDto.name}' already exists.`);
    }

    return this.prisma.department.create({
      data: createDto,
    });
  }

  async findAllDepartments(scopes: UserScopeGrant[]): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: {
        AND: [
          { properties: { some: { property: propertyWhereForScopes(scopes) } } },
          ...(scopes.some((scope) => scope.role === Role.ADMIN)
            ? []
            : [{ id: { in: [...new Set(scopes.flatMap((scope) => scope.departmentIds))] } }]),
        ],
      },
    });
  }

  async findDepartmentById(id: string, scopes: UserScopeGrant[]): Promise<Department> {
    const department = await this.prisma.department.findFirst({
      where: {
        AND: [
          { id },
          { properties: { some: { property: propertyWhereForScopes(scopes) } } },
          ...(scopes.some((scope) => scope.role === Role.ADMIN)
            ? []
            : [{ id: { in: [...new Set(scopes.flatMap((scope) => scope.departmentIds))] } }]),
        ],
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found.`);
    }

    return department;
  }
}