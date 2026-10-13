import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department } from '@prisma/client';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
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