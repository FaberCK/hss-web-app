import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Req, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Property, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controller handling property routing and endpoints.
 */
@Controller('properties')
@UseGuards(RolesGuard) // Applies the guard to all routes in this controller
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}
  
  @Post()
  @Roles(Role.ADMIN) // Strictly limits property creation to ADMINs
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPropertyDto: CreatePropertyDto, @Req() req: express.Request): Promise<Property> {
    return this.propertiesService.createProperty(createPropertyDto, req.user!.activeScopes);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: express.Request,
  ): Promise<Property> {
    return this.propertiesService.updateProperty(id, updatePropertyDto, req.user!.activeScopes);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: express.Request): Promise<Property[]> {
    return this.propertiesService.findAllProperties(req.user!.activeScopes);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Req() req: express.Request): Promise<Property> {
    return this.propertiesService.findPropertyById(id, req.user!.activeScopes);
  }
}