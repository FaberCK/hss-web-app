import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department } from '@prisma/client';

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

  async findAllDepartments(): Promise<Department[]> {
    return this.prisma.department.findMany();
  }

  async findDepartmentById(id: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found.`);
    }

    return department;
  }
}