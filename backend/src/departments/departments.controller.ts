import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department, Role } from '@prisma/client';
import { DepartmentAccessGuard } from '../auth/guards/department.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('departments')
@UseGuards(RolesGuard, DepartmentAccessGuard) // Applies the guard to all routes in this controller
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateDepartmentDto): Promise<Department> {
    return this.departmentsService.createDepartment(createDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Department[]> {
    return this.departmentsService.findAllDepartments();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Department> {
    return this.departmentsService.findDepartmentById(id);
  }
}