import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { Division, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { DivisionsService } from './divisions.service';

@Controller('divisions')
@UseGuards(RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true }))
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  @Get()
  async findAll(@Req() req: express.Request): Promise<Division[]> {
    return this.divisionsService.findAll(req.user!.activeScopes);
  }

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDivisionDto, @Req() req: express.Request): Promise<Division> {
    return this.divisionsService.create(dto, req.user!.activeScopes, req.user!.organizationId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDivisionDto,
    @Req() req: express.Request,
  ): Promise<Division> {
    return this.divisionsService.update(id, dto, req.user!.activeScopes, req.user!.organizationId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: express.Request): Promise<Division> {
    return this.divisionsService.remove(id, req.user!.activeScopes);
  }
}