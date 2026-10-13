import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { Property } from '@prisma/client';

/**
 * Controller handling property routing and endpoints.
 */
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPropertyDto: CreatePropertyDto): Promise<Property> {
    return this.propertiesService.createProperty(createPropertyDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Property[]> {
    return this.propertiesService.findAllProperties();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Property> {
    return this.propertiesService.findPropertyById(id);
  }
}