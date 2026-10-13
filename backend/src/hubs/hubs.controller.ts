import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubPropertiesDto } from './dto/update-hub-properties.dto';
import { Hub } from '@prisma/client';

@Controller('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHubDto: CreateHubDto): Promise<Hub> {
    return this.hubsService.createHub(createHubDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Hub[]> {
    return this.hubsService.findAllHubs();
  }

  @Patch(':id/properties')
  @HttpCode(HttpStatus.OK)
  async updateProperties(
    @Param('id') id: string,
    @Body() updateDto: UpdateHubPropertiesDto,
  ): Promise<Hub> {
    return this.hubsService.updateHubProperties(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<Hub> {
    return this.hubsService.deleteHub(id);
  }
}